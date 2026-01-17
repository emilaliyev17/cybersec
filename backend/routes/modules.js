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
