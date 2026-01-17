const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/checklist - Get user's checklist items with progress
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                oci.id,
                oci.title,
                oci.description,
                oci.category,
                oci.item_order,
                COALESCE(ucp.is_completed, FALSE) as is_completed,
                ucp.completed_at,
                ucp.notes
            FROM users u
            JOIN onboarding_checklist_items oci ON oci.track_id = u.training_track_id
            LEFT JOIN user_checklist_progress ucp ON oci.id = ucp.checklist_item_id AND ucp.user_id = u.id
            WHERE u.id = $1 AND oci.is_active = TRUE
            ORDER BY oci.item_order
        `, [req.user.id]);

        res.json({ checklistItems: result.rows });
    } catch (error) {
        console.error('Get checklist error:', error);
        res.status(500).json({ error: 'Server error fetching checklist' });
    }
});

// GET /api/checklist/summary - Get checklist completion summary
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(oci.id) as total_items,
                COUNT(CASE WHEN ucp.is_completed THEN 1 END) as completed_items,
                ARRAY_AGG(DISTINCT oci.category) FILTER (WHERE oci.category IS NOT NULL) as categories
            FROM users u
            JOIN onboarding_checklist_items oci ON oci.track_id = u.training_track_id
            LEFT JOIN user_checklist_progress ucp ON oci.id = ucp.checklist_item_id AND ucp.user_id = u.id
            WHERE u.id = $1 AND oci.is_active = TRUE
        `, [req.user.id]);

        const summary = result.rows[0];
        summary.total_items = parseInt(summary.total_items) || 0;
        summary.completed_items = parseInt(summary.completed_items) || 0;
        summary.completion_percentage = summary.total_items > 0
            ? Math.round((summary.completed_items / summary.total_items) * 100)
            : 0;

        res.json({ summary });
    } catch (error) {
        console.error('Get checklist summary error:', error);
        res.status(500).json({ error: 'Server error fetching checklist summary' });
    }
});

// PUT /api/checklist/:itemId - Update checklist item progress
router.put('/:itemId', authMiddleware, async (req, res) => {
    const { itemId } = req.params;
    const { is_completed, notes } = req.body;

    try {
        // Verify the checklist item belongs to user's track
        const verifyResult = await pool.query(`
            SELECT oci.id
            FROM onboarding_checklist_items oci
            JOIN users u ON u.training_track_id = oci.track_id
            WHERE oci.id = $1 AND u.id = $2
        `, [itemId, req.user.id]);

        if (verifyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Checklist item not found or not accessible' });
        }

        const result = await pool.query(`
            INSERT INTO user_checklist_progress (user_id, checklist_item_id, is_completed, completed_at, notes)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, checklist_item_id)
            DO UPDATE SET
                is_completed = EXCLUDED.is_completed,
                completed_at = CASE WHEN EXCLUDED.is_completed THEN CURRENT_TIMESTAMP ELSE NULL END,
                notes = COALESCE(EXCLUDED.notes, user_checklist_progress.notes),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [req.user.id, itemId, is_completed, is_completed ? new Date() : null, notes]);

        res.json({
            message: 'Checklist item updated',
            progress: result.rows[0]
        });
    } catch (error) {
        console.error('Update checklist item error:', error);
        res.status(500).json({ error: 'Server error updating checklist item' });
    }
});

// GET /api/checklist/by-category - Get checklist grouped by category
router.get('/by-category', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                oci.category,
                json_agg(
                    json_build_object(
                        'id', oci.id,
                        'title', oci.title,
                        'description', oci.description,
                        'item_order', oci.item_order,
                        'is_completed', COALESCE(ucp.is_completed, FALSE),
                        'completed_at', ucp.completed_at
                    ) ORDER BY oci.item_order
                ) as items,
                COUNT(oci.id) as total,
                COUNT(CASE WHEN ucp.is_completed THEN 1 END) as completed
            FROM users u
            JOIN onboarding_checklist_items oci ON oci.track_id = u.training_track_id
            LEFT JOIN user_checklist_progress ucp ON oci.id = ucp.checklist_item_id AND ucp.user_id = u.id
            WHERE u.id = $1 AND oci.is_active = TRUE
            GROUP BY oci.category
            ORDER BY MIN(oci.item_order)
        `, [req.user.id]);

        res.json({ categories: result.rows });
    } catch (error) {
        console.error('Get checklist by category error:', error);
        res.status(500).json({ error: 'Server error fetching checklist' });
    }
});

module.exports = router;
