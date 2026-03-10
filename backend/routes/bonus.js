const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// GET /api/bonus/calculator/:configId
// Returns all data needed to render the table
// ============================================
router.get('/calculator/:configId', async (req, res) => {
  try {
    const { configId } = req.params;

    const configResult = await pool.query(
      'SELECT * FROM bonus_config WHERE id = $1',
      [configId]
    );
    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    const [milestonesResult, guidanceResult, employeesResult] = await Promise.all([
      pool.query(
        'SELECT * FROM bonus_milestones WHERE config_id = $1 ORDER BY sequence',
        [configId]
      ),
      pool.query(
        'SELECT * FROM bonus_guidance_ranges WHERE config_id = $1 ORDER BY rating, target_range',
        [configId]
      ),
      pool.query(`
        SELECT
          bed.*,
          u.name AS resource_name,
          u.hire_date AS join_date,
          ub.job_title AS title
        FROM bonus_employee_data bed
        JOIN users u ON u.id = bed.user_id
        LEFT JOIN user_bios ub ON ub.user_id = bed.user_id
        WHERE bed.config_id = $1
        ORDER BY bed.sort_order
      `, [configId])
    ]);

    res.json({
      config: configResult.rows[0],
      milestones: milestonesResult.rows,
      guidanceRanges: guidanceResult.rows,
      employees: employeesResult.rows,
    });
  } catch (error) {
    console.error('Get bonus calculator error:', error);
    res.status(500).json({ error: 'Server error fetching bonus calculator data' });
  }
});

// ============================================
// PUT /api/bonus/employee/:id
// Update a single employee's editable fields
// ============================================
router.put('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lcy_currency, salary_lcy, bonus_pct, sign_on_bonus_lcy,
      eligible, spot_bonus_lcy, rating, target_range, is_active
    } = req.body;

    const result = await pool.query(`
      UPDATE bonus_employee_data SET
        lcy_currency = COALESCE($1, lcy_currency),
        salary_lcy = COALESCE($2, salary_lcy),
        bonus_pct = COALESCE($3, bonus_pct),
        sign_on_bonus_lcy = COALESCE($4, sign_on_bonus_lcy),
        eligible = COALESCE($5, eligible),
        spot_bonus_lcy = COALESCE($6, spot_bonus_lcy),
        rating = $7,
        target_range = $8,
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [
      lcy_currency, salary_lcy, bonus_pct, sign_on_bonus_lcy,
      eligible, spot_bonus_lcy, rating, target_range, is_active, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    res.json({ employee: result.rows[0] });
  } catch (error) {
    console.error('Update bonus employee error:', error);
    res.status(500).json({ error: 'Server error updating employee' });
  }
});

// ============================================
// PUT /api/bonus/config/:id
// Update active_milestone_sequence
// ============================================
router.put('/config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active_milestone_sequence } = req.body;

    const result = await pool.query(`
      UPDATE bonus_config SET
        active_milestone_sequence = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [active_milestone_sequence, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    res.json({ config: result.rows[0] });
  } catch (error) {
    console.error('Update bonus config error:', error);
    res.status(500).json({ error: 'Server error updating config' });
  }
});

// ============================================
// PUT /api/bonus/config/:id/weights
// Update perf_weight / tenure_weight
// ============================================
router.put('/config/:id/weights', async (req, res) => {
  try {
    const { id } = req.params;
    const { perf_weight, tenure_weight } = req.body;

    const result = await pool.query(`
      UPDATE bonus_config SET
        perf_weight = $1,
        tenure_weight = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [perf_weight, tenure_weight, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    res.json({ config: result.rows[0] });
  } catch (error) {
    console.error('Update bonus weights error:', error);
    res.status(500).json({ error: 'Server error updating weights' });
  }
});

// ============================================
// GET /api/bonus/config/:id/milestones
// ============================================
router.get('/config/:id/milestones', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bonus_milestones WHERE config_id = $1 ORDER BY sequence',
      [req.params.id]
    );
    res.json({ milestones: result.rows });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Server error fetching milestones' });
  }
});

// ============================================
// GET /api/bonus/config/:id/guidance-ranges
// ============================================
router.get('/config/:id/guidance-ranges', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bonus_guidance_ranges WHERE config_id = $1 ORDER BY rating, target_range',
      [req.params.id]
    );
    res.json({ guidanceRanges: result.rows });
  } catch (error) {
    console.error('Get guidance ranges error:', error);
    res.status(500).json({ error: 'Server error fetching guidance ranges' });
  }
});

module.exports = router;
