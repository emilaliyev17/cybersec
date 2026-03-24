const express = require('express');
const pool = require('../config/db');
const tsmanPool = require('../config/tsmanDb');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// FX rate cache (24-hour TTL)
let fxCache = { rates: null, fetchedAt: 0 };
const FX_CACHE_TTL = 24 * 60 * 60 * 1000;
const FX_FALLBACK = { CAD: 1.36, USD: 1, GBP: 0.79, INR: 83.5, MAD: 9.8 };

async function fetchFxRates() {
  const now = Date.now();
  if (fxCache.rates && (now - fxCache.fetchedAt) < FX_CACHE_TTL) {
    return fxCache.rates;
  }
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    console.warn('EXCHANGE_RATE_API_KEY not set, using fallback FX rates');
    return FX_FALLBACK;
  }
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
    const data = await res.json();
    if (data.result === 'success' && data.conversion_rates) {
      fxCache = { rates: data.conversion_rates, fetchedAt: now };
      console.log('FX rates updated from ExchangeRate-API');
      return data.conversion_rates;
    }
    console.warn('ExchangeRate-API unexpected response:', data);
    return fxCache.rates || FX_FALLBACK;
  } catch (err) {
    console.error('ExchangeRate-API fetch failed:', err.message);
    return fxCache.rates || FX_FALLBACK;
  }
}

router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================
// GET /api/bonus/fx-rates
// Returns live FX rates (base=USD), cached 24h
// ============================================
router.get('/fx-rates', async (req, res) => {
  try {
    const rates = await fetchFxRates();
    res.json({ base: 'USD', rates });
  } catch (error) {
    console.error('FX rates error:', error);
    res.status(500).json({ error: 'Failed to fetch FX rates', rates: FX_FALLBACK });
  }
});

// ============================================
// GET /api/bonus/calculator/:programId
// Returns all data needed to render the table.
// ============================================
router.get('/calculator/:programId', async (req, res) => {
  try {
    const { programId } = req.params;

    const configResult = await pool.query(
      `SELECT id, program_name, year, active_milestone_sequence,
              perf_weight, tenure_weight, base_allocation, actual_revenue,
              status, created_at, updated_at
       FROM bonus_config WHERE id = $1`,
      [programId]
    );
    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    const [milestonesResult, guidanceResult, employeesResult] = await Promise.all([
      pool.query(
        `SELECT id, config_id, sequence, target_revenue, profit_share_pct
         FROM bonus_milestones WHERE config_id = $1 ORDER BY sequence`,
        [programId]
      ),
      pool.query(
        `SELECT id, config_id, rating, target_range,
                milestone2_pct, milestone3_pct, milestone4_pct
         FROM bonus_guidance_ranges WHERE config_id = $1
         ORDER BY rating, target_range`,
        [programId]
      ),
      pool.query(
        `SELECT
          bed.id, bed.config_id, bed.user_id, bed.tsman_user_id,
          bed.sort_order, bed.lcy_currency, bed.salary_lcy, bed.bonus_pct,
          bed.sign_on_bonus_lcy, bed.eligible, bed.spot_bonus_lcy,
          bed.target_range, bed.is_active, bed.total_comp_lcy,
          bed.resource_name_override, bed.title_override,
          bed.hire_date_override, bed.created_at, bed.updated_at,
          bed.rating, bed.final_pool_override_usd,
          COALESCE(bed.resource_name_override, u.name) AS resource_name,
          COALESCE(bed.hire_date_override, u.hire_date) AS join_date,
          COALESCE(bed.title_override, ub.job_title) AS title
        FROM bonus_employee_data bed
        LEFT JOIN users u ON u.id = bed.user_id
        LEFT JOIN user_bios ub ON ub.user_id = bed.user_id
        WHERE bed.config_id = $1
        ORDER BY bed.sort_order`,
        [programId]
      ),
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
// GET /api/bonus/ts-users
// Returns active users from tsmandb
// ============================================
router.get('/ts-users', async (req, res) => {
  try {
    const result = await tsmanPool.query(`
      SELECT
        u."userId" AS id,
        u."Name"   AS name,
        u."Email"  AS email,
        u."status" AS status,
        r.title    AS title
      FROM "Users" u
      LEFT JOIN "Roles" r ON r.title_id = CAST(u."Title" AS VARCHAR)
      WHERE u."status" = 'active'
      ORDER BY u."Name" ASC
    `);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get ts-users error:', error);
    res.status(500).json({ error: 'Server error fetching ts_man users' });
  }
});

// ============================================
// POST /api/bonus/employee
// Add a new employee row (from ts_man or manual)
// ============================================
router.post('/employee', async (req, res) => {
  try {
    const {
      config_id,
      tsman_user_id,
      resource_name_override,
      title_override,
      hire_date_override,
      lcy_currency,
      salary_lcy,
      bonus_pct,
      sign_on_bonus_lcy,
      eligible,
      spot_bonus_lcy,
      rating,
      target_range,
      is_active,
    } = req.body;

    if (!config_id) {
      return res.status(400).json({ error: 'config_id is required' });
    }
    if (!tsman_user_id && !resource_name_override) {
      return res.status(400).json({ error: 'Either tsman_user_id or resource_name_override is required' });
    }

    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM bonus_employee_data WHERE config_id = $1',
      [config_id]
    );
    const nextOrder = orderResult.rows[0].next_order;

    const empResult = await pool.query(`
      INSERT INTO bonus_employee_data (
        config_id, user_id, tsman_user_id, resource_name_override,
        title_override, hire_date_override, sort_order,
        lcy_currency, salary_lcy, bonus_pct, sign_on_bonus_lcy,
        eligible, spot_bonus_lcy, target_range, is_active, rating
      ) VALUES (
        $1, NULL, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      RETURNING *
    `, [
      config_id,
      tsman_user_id || null,
      resource_name_override || null,
      title_override || null,
      hire_date_override || null,
      nextOrder,
      lcy_currency || 'USD',
      salary_lcy || 0,
      bonus_pct || 0,
      sign_on_bonus_lcy || 0,
      eligible !== undefined ? eligible : true,
      spot_bonus_lcy || 0,
      target_range || null,
      is_active !== undefined ? is_active : true,
      rating || null,
    ]);

    const row = empResult.rows[0];

    res.status(201).json({
      employee: {
        ...row,
        resource_name: row.resource_name_override,
        title: row.title_override,
        join_date: row.hire_date_override,
      },
    });
  } catch (error) {
    console.error('Create bonus employee error:', error);
    res.status(500).json({ error: 'Server error creating employee row' });
  }
});

// ============================================
// PUT /api/bonus/employee/:id
// Update a single employee's editable fields
// ============================================
router.put('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Build dynamic UPDATE to only touch fields that were explicitly sent
    const fieldMap = {
      lcy_currency: 'lcy_currency',
      salary_lcy: 'salary_lcy',
      bonus_pct: 'bonus_pct',
      sign_on_bonus_lcy: 'sign_on_bonus_lcy',
      eligible: 'eligible',
      spot_bonus_lcy: 'spot_bonus_lcy',
      rating: 'rating',
      target_range: 'target_range',
      is_active: 'is_active',
      hire_date_override: 'hire_date_override',
      total_comp_lcy: 'total_comp_lcy',
      final_pool_override_usd: 'final_pool_override_usd',
    };

    const setClauses = ['updated_at = NOW()'];
    const values = [];
    let paramIdx = 1;

    for (const [bodyKey, column] of Object.entries(fieldMap)) {
      if (bodyKey in body) {
        setClauses.push(`${column} = $${paramIdx}`);
        values.push(body[bodyKey]);
        paramIdx++;
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE bonus_employee_data SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

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
// DELETE /api/bonus/employee/:id
// Remove an employee row from the bonus table
// ============================================
router.delete('/employee/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM bonus_employee_data WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    res.json({ deleted: result.rows[0].id });
  } catch (error) {
    console.error('Delete bonus employee error:', error);
    res.status(500).json({ error: 'Server error deleting employee' });
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
      RETURNING id, active_milestone_sequence, perf_weight, tenure_weight, status, updated_at
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
      RETURNING id, active_milestone_sequence, perf_weight, tenure_weight, updated_at
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
// PUT /api/bonus/milestone/:id
// Update a milestone's profit_share_pct
// ============================================
router.put('/milestone/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { profit_share_pct } = req.body;

    const result = await pool.query(`
      UPDATE bonus_milestones SET profit_share_pct = $1 WHERE id = $2 RETURNING *
    `, [profit_share_pct, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json({ milestone: result.rows[0] });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ error: 'Server error updating milestone' });
  }
});

// ============================================
// PUT /api/bonus/guidance-range/:id
// Update a guidance range's milestone percentages
// ============================================
router.put('/guidance-range/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { milestone2_pct, milestone3_pct, milestone4_pct } = req.body;

    const result = await pool.query(`
      UPDATE bonus_guidance_ranges SET
        milestone2_pct = COALESCE($1, milestone2_pct),
        milestone3_pct = COALESCE($2, milestone3_pct),
        milestone4_pct = COALESCE($3, milestone4_pct)
      WHERE id = $4 RETURNING *
    `, [milestone2_pct, milestone3_pct, milestone4_pct, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guidance range not found' });
    }
    res.json({ guidanceRange: result.rows[0] });
  } catch (error) {
    console.error('Update guidance range error:', error);
    res.status(500).json({ error: 'Server error updating guidance range' });
  }
});

// ============================================
// GET /api/bonus/config/:id/milestones
// ============================================
router.get('/config/:id/milestones', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, config_id, sequence, target_revenue, profit_share_pct
       FROM bonus_milestones WHERE config_id = $1 ORDER BY sequence`,
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
      `SELECT id, config_id, rating, target_range,
              milestone2_pct, milestone3_pct, milestone4_pct
       FROM bonus_guidance_ranges WHERE config_id = $1 ORDER BY rating, target_range`,
      [req.params.id]
    );
    res.json({ guidanceRanges: result.rows });
  } catch (error) {
    console.error('Get guidance ranges error:', error);
    res.status(500).json({ error: 'Server error fetching guidance ranges' });
  }
});

// ============================================
// PUT /api/bonus/config/:id/seal
// Toggle sealed status (draft <-> sealed)
// ============================================
router.put('/config/:id/seal', async (req, res) => {
  try {
    const { id } = req.params;
    const { sealed } = req.body;
    const newStatus = sealed ? 'sealed' : 'draft';

    const result = await pool.query(
      `UPDATE bonus_config SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at`,
      [newStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json({ config: result.rows[0] });
  } catch (error) {
    console.error('Seal/unseal error:', error);
    res.status(500).json({ error: 'Server error toggling seal' });
  }
});

// ============================================
// GET /api/bonus/calculator/:programId/export-excel
// Generate and download Excel report (main table only)
// ============================================
router.get('/calculator/:programId/export-excel', async (req, res) => {
  try {
    const { programId } = req.params;

    const configResult = await pool.query(
      `SELECT id, program_name, year, active_milestone_sequence,
              perf_weight, tenure_weight, base_allocation, actual_revenue,
              status, created_at, updated_at
       FROM bonus_config WHERE id = $1`,
      [programId]
    );
    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    const [milestonesResult, guidanceResult, employeesResult] = await Promise.all([
      pool.query(
        `SELECT id, config_id, sequence, target_revenue, profit_share_pct
         FROM bonus_milestones WHERE config_id = $1 ORDER BY sequence`,
        [programId]
      ),
      pool.query(
        `SELECT id, config_id, rating, target_range,
                milestone2_pct, milestone3_pct, milestone4_pct
         FROM bonus_guidance_ranges WHERE config_id = $1
         ORDER BY rating, target_range`,
        [programId]
      ),
      pool.query(
        `SELECT
          bed.id, bed.config_id, bed.user_id, bed.tsman_user_id,
          bed.sort_order, bed.lcy_currency, bed.salary_lcy, bed.bonus_pct,
          bed.sign_on_bonus_lcy, bed.eligible, bed.spot_bonus_lcy,
          bed.target_range, bed.is_active, bed.total_comp_lcy,
          bed.resource_name_override, bed.title_override,
          bed.hire_date_override, bed.rating, bed.final_pool_override_usd,
          COALESCE(bed.resource_name_override, u.name) AS resource_name,
          COALESCE(bed.hire_date_override, u.hire_date) AS join_date,
          COALESCE(bed.title_override, ub.job_title) AS title
        FROM bonus_employee_data bed
        LEFT JOIN users u ON u.id = bed.user_id
        LEFT JOIN user_bios ub ON ub.user_id = bed.user_id
        WHERE bed.config_id = $1
        ORDER BY bed.sort_order`,
        [programId]
      ),
    ]);

    const fxRates = await fetchFxRates();
    const { computeBonusData } = require('../services/bonusCalculations');
    const { generateBonusExcel } = require('../services/bonusExcelService');

    const computed = computeBonusData({
      config: configResult.rows[0],
      milestones: milestonesResult.rows,
      guidanceRanges: guidanceResult.rows,
      employees: employeesResult.rows,
      fxRates,
    });

    const excelBuffer = await generateBonusExcel({
      config: configResult.rows[0],
      computed,
      fxRates,
    });

    const fileName = `Bonus_Calculator_${configResult.rows[0].program_name || 'Report'}_${configResult.rows[0].year || ''}.xlsx`;
    res.contentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export bonus Excel error:', error);
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});

// ============================================
// GET /api/bonus/calculator/:programId/export-pdf
// Generate and download PDF report
// ============================================
router.get('/calculator/:programId/export-pdf', async (req, res) => {
  try {
    const { programId } = req.params;

    const configResult = await pool.query(
      `SELECT id, program_name, year, active_milestone_sequence,
              perf_weight, tenure_weight, base_allocation, actual_revenue,
              status, created_at, updated_at
       FROM bonus_config WHERE id = $1`,
      [programId]
    );
    if (configResult.rows.length === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    const [milestonesResult, guidanceResult, employeesResult] = await Promise.all([
      pool.query(
        `SELECT id, config_id, sequence, target_revenue, profit_share_pct
         FROM bonus_milestones WHERE config_id = $1 ORDER BY sequence`,
        [programId]
      ),
      pool.query(
        `SELECT id, config_id, rating, target_range,
                milestone2_pct, milestone3_pct, milestone4_pct
         FROM bonus_guidance_ranges WHERE config_id = $1
         ORDER BY rating, target_range`,
        [programId]
      ),
      pool.query(
        `SELECT
          bed.id, bed.config_id, bed.user_id, bed.tsman_user_id,
          bed.sort_order, bed.lcy_currency, bed.salary_lcy, bed.bonus_pct,
          bed.sign_on_bonus_lcy, bed.eligible, bed.spot_bonus_lcy,
          bed.target_range, bed.is_active, bed.total_comp_lcy,
          bed.resource_name_override, bed.title_override,
          bed.hire_date_override, bed.rating, bed.final_pool_override_usd,
          COALESCE(bed.resource_name_override, u.name) AS resource_name,
          COALESCE(bed.hire_date_override, u.hire_date) AS join_date,
          COALESCE(bed.title_override, ub.job_title) AS title
        FROM bonus_employee_data bed
        LEFT JOIN users u ON u.id = bed.user_id
        LEFT JOIN user_bios ub ON ub.user_id = bed.user_id
        WHERE bed.config_id = $1
        ORDER BY bed.sort_order`,
        [programId]
      ),
    ]);

    const fxRates = await fetchFxRates();

    const { computeBonusData } = require('../services/bonusCalculations');
    const { generateBonusPdf } = require('../services/bonusPdfService');

    const computed = computeBonusData({
      config: configResult.rows[0],
      milestones: milestonesResult.rows,
      guidanceRanges: guidanceResult.rows,
      employees: employeesResult.rows,
      fxRates,
    });

    const pdfBuffer = await generateBonusPdf({
      config: configResult.rows[0],
      computed,
      guidanceRanges: guidanceResult.rows,
    });

    const fileName = `Bonus_Calculator_${configResult.rows[0].program_name || 'Report'}_${configResult.rows[0].year || ''}.pdf`;
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export bonus PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
