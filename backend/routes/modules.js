const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/modules - Get training modules based on user's assigned track
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get user's track ID
    const userTrack = await pool.query(
      'SELECT training_track_id FROM users WHERE id = $1',
      [req.user.id]
    );

    const trackId = userTrack.rows[0]?.training_track_id;

    let result;

    if (trackId) {
      // User has assigned track - return only track modules
      result = await pool.query(
        `SELECT
          tm.id,
          tm.title,
          tm.description,
          tm.content_json,
          tm.required_time_seconds,
          trm.display_order as module_order,
          trm.is_required,
          COALESCE(up.is_completed, FALSE) as is_completed,
          COALESCE(up.watched_seconds, 0) as watched_seconds,
          up.started_at,
          up.completed_at,
          up.updated_at
         FROM track_modules trm
         JOIN training_modules tm ON trm.module_id = tm.id
         LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
         WHERE trm.track_id = $2 AND tm.is_active = TRUE
         ORDER BY trm.display_order`,
        [req.user.id, trackId]
      );
    } else {
      // No track assigned - return all active modules (legacy behavior)
      result = await pool.query(
        `SELECT
          tm.id,
          tm.title,
          tm.description,
          tm.content_json,
          tm.required_time_seconds,
          tm.module_order,
          TRUE as is_required,
          COALESCE(up.is_completed, FALSE) as is_completed,
          COALESCE(up.watched_seconds, 0) as watched_seconds,
          up.started_at,
          up.completed_at,
          up.updated_at
         FROM training_modules tm
         LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
         WHERE tm.is_active = TRUE
         ORDER BY tm.module_order`,
        [req.user.id]
      );
    }

    res.json({ modules: result.rows, trackId });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Server error fetching modules' });
  }
});

// GET /api/modules/:id - Get single module with content
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        tm.id,
        tm.title,
        tm.description,
        tm.content_json,
        tm.required_time_seconds,
        tm.module_order,
        COALESCE(up.is_completed, FALSE) as is_completed,
        COALESCE(up.watched_seconds, 0) as watched_seconds,
        up.started_at,
        up.completed_at
       FROM training_modules tm
       LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
       WHERE tm.id = $2 AND tm.is_active = TRUE`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({ module: result.rows[0] });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ error: 'Server error fetching module' });
  }
});

// POST /api/modules/:id/progress - Update progress for a module
router.post('/:id/progress', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { is_completed } = req.body;

  try {
    // Check if module exists
    const moduleResult = await pool.query(
      'SELECT id FROM training_modules WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Update or insert progress - no time requirement, just mark as completed
    const result = await pool.query(
      `INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds, started_at, completed_at)
       VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (user_id, module_id)
       DO UPDATE SET
         is_completed = EXCLUDED.is_completed,
         started_at = COALESCE(user_progress.started_at, CURRENT_TIMESTAMP),
         completed_at = CASE WHEN EXCLUDED.is_completed THEN CURRENT_TIMESTAMP ELSE user_progress.completed_at END
       RETURNING *`,
      [req.user.id, id, is_completed, is_completed ? new Date() : null]
    );

    // Check if all modules are now completed and auto-complete training_completed items
    if (is_completed) {
      const progressCheck = await pool.query(`
        SELECT
          COUNT(tm.id) as total_modules,
          COUNT(CASE WHEN up.is_completed THEN 1 END) as completed_modules
        FROM training_modules tm
        LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
        WHERE tm.is_active = TRUE
      `, [req.user.id]);

      const { total_modules, completed_modules } = progressCheck.rows[0];

      if (parseInt(completed_modules) >= parseInt(total_modules)) {
        // All modules completed - auto-complete 'training_completed' items
        await pool.query(`
          INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed, completed_at, completed_by)
          SELECT uc.id, cti.id, TRUE, CURRENT_TIMESTAMP, $1
          FROM user_checklists uc
          JOIN checklist_templates ct ON uc.template_id = ct.id
          JOIN checklist_sections cs ON ct.id = cs.template_id
          JOIN checklist_template_items cti ON cs.id = cti.section_id
          WHERE uc.user_id = $1
            AND uc.status != 'completed'
            AND cti.auto_complete_trigger = 'training_completed'
            AND cti.is_active = TRUE
            AND cs.is_active = TRUE
          ON CONFLICT (user_checklist_id, template_item_id)
          DO UPDATE SET
            is_completed = TRUE,
            completed_at = CURRENT_TIMESTAMP,
            completed_by = $1,
            updated_at = CURRENT_TIMESTAMP
        `, [req.user.id]);

        // Update checklist status
        await pool.query(`
          UPDATE user_checklists uc
          SET status = CASE
            WHEN (
              SELECT COUNT(*) FROM checklist_template_items cti
              JOIN checklist_sections cs ON cti.section_id = cs.id
              WHERE cs.template_id = uc.template_id AND cti.is_active = TRUE AND cs.is_active = TRUE
            ) = (
              SELECT COUNT(*) FROM user_checklist_items uci
              JOIN checklist_template_items cti ON uci.template_item_id = cti.id
              JOIN checklist_sections cs ON cti.section_id = cs.id
              WHERE uci.user_checklist_id = uc.id AND uci.is_completed = TRUE
                AND cti.is_active = TRUE AND cs.is_active = TRUE
            )
            THEN 'completed'
            WHEN uc.status = 'not_started'
            THEN 'in_progress'
            ELSE uc.status
          END,
          completed_at = CASE
            WHEN (
              SELECT COUNT(*) FROM checklist_template_items cti
              JOIN checklist_sections cs ON cti.section_id = cs.id
              WHERE cs.template_id = uc.template_id AND cti.is_active = TRUE AND cs.is_active = TRUE
            ) = (
              SELECT COUNT(*) FROM user_checklist_items uci
              JOIN checklist_template_items cti ON uci.template_item_id = cti.id
              JOIN checklist_sections cs ON cti.section_id = cs.id
              WHERE uci.user_checklist_id = uc.id AND uci.is_completed = TRUE
                AND cti.is_active = TRUE AND cs.is_active = TRUE
            )
            THEN CURRENT_TIMESTAMP
            ELSE NULL
          END
          WHERE uc.user_id = $1 AND uc.status != 'completed'
        `, [req.user.id]);
      }
    }

    res.json({
      message: 'Progress updated',
      progress: result.rows[0],
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Server error updating progress' });
  }
});

// GET /api/modules/progress/summary - Get user's overall progress summary (track-aware)
router.get('/progress/summary', authMiddleware, async (req, res) => {
  try {
    // Get user's track ID
    const userTrack = await pool.query(
      'SELECT training_track_id FROM users WHERE id = $1',
      [req.user.id]
    );

    const trackId = userTrack.rows[0]?.training_track_id;

    let result;

    if (trackId) {
      // Track-based summary
      result = await pool.query(
        `SELECT
          COUNT(tm.id) as total_modules,
          COUNT(CASE WHEN up.is_completed THEN 1 END) as completed_modules,
          COALESCE(SUM(up.watched_seconds), 0) as total_watched_seconds,
          COALESCE(SUM(tm.required_time_seconds), 0) as total_required_seconds
         FROM track_modules trm
         JOIN training_modules tm ON trm.module_id = tm.id
         LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
         WHERE trm.track_id = $2 AND tm.is_active = TRUE`,
        [req.user.id, trackId]
      );
    } else {
      // Legacy behavior - all modules
      result = await pool.query(
        `SELECT
          COUNT(tm.id) as total_modules,
          COUNT(CASE WHEN up.is_completed THEN 1 END) as completed_modules,
          COALESCE(SUM(up.watched_seconds), 0) as total_watched_seconds,
          COALESCE(SUM(tm.required_time_seconds), 0) as total_required_seconds
         FROM training_modules tm
         LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
         WHERE tm.is_active = TRUE`,
        [req.user.id]
      );
    }

    const summary = result.rows[0];
    summary.total_modules = parseInt(summary.total_modules) || 0;
    summary.completed_modules = parseInt(summary.completed_modules) || 0;
    summary.completion_percentage = summary.total_modules > 0
      ? Math.round((summary.completed_modules / summary.total_modules) * 100)
      : 0;
    summary.all_modules_completed = summary.completed_modules === summary.total_modules;
    summary.track_id = trackId;

    res.json({ summary });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Server error fetching progress summary' });
  }
});

module.exports = router;
