const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper function to create admin pre-onboarding checklists for a new employee
async function createAdminPreonboardingChecklists(newUserId) {
  try {
    // Get the admin-preonboarding template
    const templateResult = await pool.query(
      "SELECT id FROM checklist_templates WHERE template_id = 'admin-preonboarding' AND is_active = TRUE"
    );

    if (templateResult.rows.length === 0) {
      console.log('Admin pre-onboarding template not found, skipping checklist creation');
      return;
    }

    const templateId = templateResult.rows[0].id;

    // Get all admin users
    const adminsResult = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    if (adminsResult.rows.length === 0) {
      console.log('No admin users found, skipping pre-onboarding checklist creation');
      return;
    }

    // Create checklist for each admin, targeting the new employee
    for (const admin of adminsResult.rows) {
      // Create checklist assignment with target_user_id
      const checklistResult = await pool.query(`
        INSERT INTO user_checklists (user_id, template_id, target_user_id, due_date)
        VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [admin.id, templateId, newUserId]);

      if (checklistResult.rows.length > 0) {
        const checklistId = checklistResult.rows[0].id;

        // Initialize all items for this checklist
        await pool.query(`
          INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed)
          SELECT $1, cti.id, FALSE
          FROM checklist_sections cs
          JOIN checklist_template_items cti ON cs.id = cti.section_id
          WHERE cs.template_id = $2 AND cs.is_active = TRUE AND cti.is_active = TRUE
          ON CONFLICT DO NOTHING
        `, [checklistId, templateId]);

        console.log(`Created admin pre-onboarding checklist for admin ${admin.id} -> new employee ${newUserId}`);
      }
    }
  } catch (error) {
    console.error('Error creating admin pre-onboarding checklists:', error);
    // Don't throw - this shouldn't block user registration
  }
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, hire_date)
         VALUES ($1, $2, $3, 'employee', CURRENT_DATE)
         RETURNING id, name, email, role, hire_date, is_certified`,
        [name, email, passwordHash]
      );

      const newUser = result.rows[0];

      // Initialize progress records for all active modules
      await pool.query(
        `INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
         SELECT $1, id, FALSE, 0 FROM training_modules WHERE is_active = TRUE`,
        [newUser.id]
      );

      // Create admin pre-onboarding checklists for all admins
      await createAdminPreonboardingChecklists(newUser.id);

      const token = generateToken(newUser);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          hire_date: newUser.hire_date,
          is_certified: newUser.is_certified,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, name, email, password_hash, role, hire_date, is_certified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          hire_date: user.hire_date,
          is_certified: user.is_certified,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, hire_date, is_certified, certification_date FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
