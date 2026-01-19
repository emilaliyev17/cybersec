const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// DASHBOARD STATS
// ============================================

// GET /api/admin/stats - Get dashboard statistics (with track info)
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_certified = true) as certified_users,
        (SELECT COUNT(*) FROM training_modules WHERE is_active = true) as total_modules,
        (SELECT COUNT(*) FROM quiz_attempts) as total_quiz_attempts,
        (SELECT COUNT(*) FROM quiz_attempts WHERE passed = true) as passed_attempts,
        (SELECT AVG(score) FROM quiz_attempts) as average_score,
        (SELECT COUNT(*) FROM users WHERE training_track_id = (SELECT id FROM training_tracks WHERE name = 'FULL')) as full_track_users,
        (SELECT COUNT(*) FROM users WHERE training_track_id = (SELECT id FROM training_tracks WHERE name = 'CONDENSED')) as condensed_track_users,
        (SELECT COUNT(*) FROM users WHERE training_track_id IS NULL) as unassigned_users
    `);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - Get all users with progress (includes track info)
router.get('/users', async (req, res) => {
  try {
    // Get total active modules count once
    const totalModulesResult = await pool.query('SELECT COUNT(*) as count FROM training_modules WHERE is_active = true');
    const totalActiveModules = parseInt(totalModulesResult.rows[0].count);

    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.hire_date,
        u.is_certified,
        u.certification_date,
        u.training_track_id,
        tt.name as track_name,
        tt.display_name as track_display_name,
        u.created_at,
        (SELECT COUNT(*) FROM user_progress up2 WHERE up2.user_id = u.id AND up2.is_completed = true) as completed_modules,
        CASE
          WHEN tt.name = 'FULL' THEN $1
          WHEN u.training_track_id IS NOT NULL THEN (SELECT COUNT(*) FROM track_modules tkm WHERE tkm.track_id = u.training_track_id)
          ELSE 0
        END as total_modules,
        (SELECT MAX(score) FROM quiz_attempts qa WHERE qa.user_id = u.id) as best_quiz_score,
        (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.user_id = u.id) as quiz_attempts
      FROM users u
      LEFT JOIN training_tracks tt ON u.training_track_id = tt.id
      ORDER BY u.created_at DESC
    `, [totalActiveModules]);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// GET /api/admin/users/:id - Get single user details
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, role, hire_date, is_certified, certification_date, training_track_id, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const progressResult = await pool.query(`
      SELECT
        tm.id as module_id,
        tm.title as module_title,
        up.is_completed,
        up.watched_seconds,
        up.started_at,
        up.completed_at
      FROM training_modules tm
      LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
      WHERE tm.is_active = true
      ORDER BY tm.module_order
    `, [id]);

    const quizResult = await pool.query(`
      SELECT id, score, total_questions, correct_answers, passed, attempt_number, time_taken_seconds, attempt_date
      FROM quiz_attempts
      WHERE user_id = $1
      ORDER BY attempt_date DESC
    `, [id]);

    res.json({
      user: userResult.rows[0],
      progress: progressResult.rows,
      quizAttempts: quizResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['employee', 'manager', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0], message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error updating role' });
  }
});

// PUT /api/admin/users/:id/track - Update user's training track
router.put('/users/:id/track', async (req, res) => {
  const { id } = req.params;
  const { trackId } = req.body;

  try {
    // Verify track exists if trackId provided
    if (trackId) {
      const trackCheck = await pool.query('SELECT id FROM training_tracks WHERE id = $1', [trackId]);
      if (trackCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Track not found' });
      }
    }

    // Update user's track assignment
    const result = await pool.query(
      'UPDATE users SET training_track_id = $1 WHERE id = $2 RETURNING id, name, email, training_track_id',
      [trackId || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize progress records for track modules
    if (trackId) {
      // Check if this is FULL track (uses all modules) or specific track (uses track_modules)
      const trackInfo = await pool.query('SELECT name FROM training_tracks WHERE id = $1', [trackId]);
      const trackName = trackInfo.rows[0]?.name;

      if (trackName === 'FULL') {
        // FULL track: create progress for ALL active modules
        await pool.query(`
          INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
          SELECT $1, tm.id, FALSE, 0
          FROM training_modules tm
          WHERE tm.is_active = true
          ON CONFLICT (user_id, module_id) DO NOTHING
        `, [id]);
      } else {
        // Other tracks: create progress only for modules in track_modules
        await pool.query(`
          INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
          SELECT $1, tkm.module_id, FALSE, 0
          FROM track_modules tkm
          WHERE tkm.track_id = $2
          ON CONFLICT (user_id, module_id) DO NOTHING
        `, [id, trackId]);
      }

      // Initialize checklist progress if applicable
      await pool.query(`
        INSERT INTO user_checklist_progress (user_id, checklist_item_id, is_completed)
        SELECT $1, oci.id, FALSE
        FROM onboarding_checklist_items oci
        WHERE oci.track_id = $2
        ON CONFLICT (user_id, checklist_item_id) DO NOTHING
      `, [id, trackId]);
    }

    res.json({ user: result.rows[0], message: 'Track updated successfully' });
  } catch (error) {
    console.error('Update track error:', error);
    res.status(500).json({ error: 'Server error updating track' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// POST /api/admin/users/:id/reset-progress - Reset user progress
router.post('/users/:id/reset-progress', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE user_progress SET is_completed = false, watched_seconds = 0, completed_at = NULL WHERE user_id = $1', [id]);
    await pool.query('UPDATE users SET is_certified = false, certification_date = NULL WHERE id = $1', [id]);

    res.json({ message: 'User progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Server error resetting progress' });
  }
});

// ============================================
// MODULE MANAGEMENT
// ============================================

// GET /api/admin/modules - Get all modules (including inactive)
router.get('/modules', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        tm.*,
        COUNT(CASE WHEN up.is_completed THEN 1 END) as completions,
        COUNT(up.id) as total_starts
      FROM training_modules tm
      LEFT JOIN user_progress up ON tm.id = up.module_id
      GROUP BY tm.id
      ORDER BY tm.module_order
    `);

    res.json({ modules: result.rows });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Server error fetching modules' });
  }
});

// POST /api/admin/modules - Create new module
router.post('/modules', async (req, res) => {
  const { title, description, content_json, required_time_seconds, module_order } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO training_modules (title, description, content_json, required_time_seconds, module_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, JSON.stringify(content_json), required_time_seconds || 300, module_order || 99]
    );

    // Create progress records for all existing users
    await pool.query(`
      INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
      SELECT id, $1, FALSE, 0 FROM users
    `, [result.rows[0].id]);

    res.status(201).json({ module: result.rows[0], message: 'Module created successfully' });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Server error creating module' });
  }
});

// PUT /api/admin/modules/:id - Update module
router.put('/modules/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, content_json, required_time_seconds, module_order, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE training_modules
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           content_json = COALESCE($3, content_json),
           required_time_seconds = COALESCE($4, required_time_seconds),
           module_order = COALESCE($5, module_order),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [title, description, content_json ? JSON.stringify(content_json) : null, required_time_seconds, module_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ module: result.rows[0], message: 'Module updated successfully' });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Server error updating module' });
  }
});

// DELETE /api/admin/modules/:id - Delete module
router.delete('/modules/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM training_modules WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Server error deleting module' });
  }
});

// ============================================
// QUIZ MANAGEMENT
// ============================================

// GET /api/admin/quiz/results - Get all quiz results
router.get('/quiz/results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        qa.id,
        qa.user_id,
        u.name as user_name,
        u.email as user_email,
        qa.score,
        qa.total_questions,
        qa.correct_answers,
        qa.passed,
        qa.attempt_number,
        qa.time_taken_seconds,
        qa.attempt_date
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      ORDER BY qa.attempt_date DESC
      LIMIT 100
    `);

    res.json({ results: result.rows });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ error: 'Server error fetching quiz results' });
  }
});

// GET /api/admin/quiz/questions - Get all quiz questions
router.get('/quiz/questions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT qq.*, tm.title as module_title
      FROM quiz_questions qq
      LEFT JOIN training_modules tm ON qq.module_id = tm.id
      ORDER BY qq.module_id, qq.id
    `);

    res.json({ questions: result.rows });
  } catch (error) {
    console.error('Get quiz questions error:', error);
    res.status(500).json({ error: 'Server error fetching quiz questions' });
  }
});

// POST /api/admin/quiz/questions - Create new question
router.post('/quiz/questions', async (req, res) => {
  const { module_id, question_text, options_json, correct_answer_index, explanation, difficulty } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO quiz_questions (module_id, question_text, options_json, correct_answer_index, explanation, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [module_id, question_text, JSON.stringify(options_json), correct_answer_index, explanation, difficulty || 'medium']
    );

    res.status(201).json({ question: result.rows[0], message: 'Question created successfully' });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Server error creating question' });
  }
});

// PUT /api/admin/quiz/questions/:id - Update question
router.put('/quiz/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { module_id, question_text, options_json, correct_answer_index, explanation, difficulty, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE quiz_questions
       SET module_id = COALESCE($1, module_id),
           question_text = COALESCE($2, question_text),
           options_json = COALESCE($3, options_json),
           correct_answer_index = COALESCE($4, correct_answer_index),
           explanation = COALESCE($5, explanation),
           difficulty = COALESCE($6, difficulty),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [module_id, question_text, options_json ? JSON.stringify(options_json) : null, correct_answer_index, explanation, difficulty, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ question: result.rows[0], message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Server error updating question' });
  }
});

// DELETE /api/admin/quiz/questions/:id - Delete question
router.delete('/quiz/questions/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM quiz_questions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Server error deleting question' });
  }
});

module.exports = router;
