const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// ============================================
// PUBLIC TRACK ENDPOINTS
// ============================================

// GET /api/tracks - Get all available tracks
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.id,
                t.name,
                t.display_name,
                t.description,
                (SELECT COUNT(*) FROM track_modules WHERE track_id = t.id) as module_count,
                (SELECT COUNT(*) FROM users WHERE training_track_id = t.id) as user_count
            FROM training_tracks t
            WHERE t.is_active = TRUE
            ORDER BY t.id
        `);
        res.json({ tracks: result.rows });
    } catch (error) {
        console.error('Get tracks error:', error);
        res.status(500).json({ error: 'Server error fetching tracks' });
    }
});

// GET /api/tracks/my-track - Get current user's assigned track with progress
router.get('/my-track', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                tt.id,
                tt.name,
                tt.display_name,
                tt.description,
                (SELECT COUNT(*) FROM track_modules WHERE track_id = tt.id) as total_modules,
                (SELECT COUNT(*) FROM track_modules trm
                 JOIN user_progress up ON trm.module_id = up.module_id
                 WHERE trm.track_id = tt.id AND up.user_id = $1 AND up.is_completed = TRUE) as completed_modules
            FROM users u
            LEFT JOIN training_tracks tt ON u.training_track_id = tt.id
            WHERE u.id = $1
        `, [req.user.id]);

        res.json({ track: result.rows[0] || null });
    } catch (error) {
        console.error('Get my track error:', error);
        res.status(500).json({ error: 'Server error fetching user track' });
    }
});

// GET /api/tracks/:id/modules - Get modules for a specific track
router.get('/:id/modules', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT
                tm.id,
                tm.title,
                tm.description,
                tm.content_json,
                tm.required_time_seconds,
                trm.display_order,
                trm.is_required,
                COALESCE(up.is_completed, FALSE) as is_completed,
                COALESCE(up.watched_seconds, 0) as watched_seconds,
                up.started_at,
                up.completed_at
            FROM track_modules trm
            JOIN training_modules tm ON trm.module_id = tm.id
            LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
            WHERE trm.track_id = $2 AND tm.is_active = TRUE
            ORDER BY trm.display_order
        `, [req.user.id, id]);

        res.json({ modules: result.rows });
    } catch (error) {
        console.error('Get track modules error:', error);
        res.status(500).json({ error: 'Server error fetching track modules' });
    }
});

// ============================================
// ADMIN TRACK MANAGEMENT ENDPOINTS
// ============================================

// GET /api/tracks/admin/all - Get all tracks with full details (admin)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const tracksResult = await pool.query(`
            SELECT
                t.id,
                t.name,
                t.display_name,
                t.description,
                t.is_active,
                t.created_at
            FROM training_tracks t
            ORDER BY t.id
        `);

        // Get modules for each track
        const tracks = await Promise.all(tracksResult.rows.map(async (track) => {
            const modulesResult = await pool.query(`
                SELECT
                    tm.id as module_id,
                    tm.title,
                    tm.description,
                    tm.module_order as original_order,
                    trm.display_order,
                    trm.is_required
                FROM track_modules trm
                JOIN training_modules tm ON trm.module_id = tm.id
                WHERE trm.track_id = $1
                ORDER BY trm.display_order
            `, [track.id]);

            return {
                ...track,
                modules: modulesResult.rows
            };
        }));

        // Get all available modules for assignment (only active)
        const allModulesResult = await pool.query(`
            SELECT id, title, description, module_order, is_active
            FROM training_modules
            WHERE is_active = TRUE
            ORDER BY module_order
        `);

        // Get user counts by track
        const userCountsResult = await pool.query(`
            SELECT
                training_track_id,
                COUNT(*) as user_count
            FROM users
            GROUP BY training_track_id
        `);

        const userCounts = {};
        userCountsResult.rows.forEach(row => {
            userCounts[row.training_track_id || 'unassigned'] = parseInt(row.user_count);
        });

        res.json({
            tracks,
            allModules: allModulesResult.rows,
            userCounts
        });
    } catch (error) {
        console.error('Get all tracks error:', error);
        res.status(500).json({ error: 'Server error fetching tracks' });
    }
});

// POST /api/tracks/:trackId/modules - Add module to track
router.post('/:trackId/modules', authMiddleware, adminMiddleware, async (req, res) => {
    const { trackId } = req.params;
    const { moduleId, displayOrder, isRequired = true } = req.body;

    try {
        // Get max display_order if not provided
        let order = displayOrder;
        if (order === undefined) {
            const maxOrderResult = await pool.query(
                'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM track_modules WHERE track_id = $1',
                [trackId]
            );
            order = maxOrderResult.rows[0].next_order;
        }

        const result = await pool.query(`
            INSERT INTO track_modules (track_id, module_id, display_order, is_required)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (track_id, module_id)
            DO UPDATE SET display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required
            RETURNING *
        `, [trackId, moduleId, order, isRequired]);

        res.json({
            message: 'Module added to track',
            trackModule: result.rows[0]
        });
    } catch (error) {
        console.error('Add module to track error:', error);
        res.status(500).json({ error: 'Server error adding module to track' });
    }
});

// DELETE /api/tracks/:trackId/modules/:moduleId - Remove module from track
router.delete('/:trackId/modules/:moduleId', authMiddleware, adminMiddleware, async (req, res) => {
    const { trackId, moduleId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM track_modules WHERE track_id = $1 AND module_id = $2 RETURNING *',
            [trackId, moduleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found in track' });
        }

        res.json({ message: 'Module removed from track' });
    } catch (error) {
        console.error('Remove module from track error:', error);
        res.status(500).json({ error: 'Server error removing module from track' });
    }
});

// PUT /api/tracks/:trackId/modules/reorder - Reorder modules in track
router.put('/:trackId/modules/reorder', authMiddleware, adminMiddleware, async (req, res) => {
    const { trackId } = req.params;
    const { moduleOrders } = req.body; // Array of { moduleId, displayOrder }

    try {
        await pool.query('BEGIN');

        for (const item of moduleOrders) {
            await pool.query(
                'UPDATE track_modules SET display_order = $1 WHERE track_id = $2 AND module_id = $3',
                [item.displayOrder, trackId, item.moduleId]
            );
        }

        await pool.query('COMMIT');
        res.json({ message: 'Modules reordered successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Reorder modules error:', error);
        res.status(500).json({ error: 'Server error reordering modules' });
    }
});

// PUT /api/tracks/assign/:userId - Assign track to user
router.put('/assign/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.params;
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
            [trackId || null, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Initialize progress records for track modules
        if (trackId) {
            await pool.query(`
                INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
                SELECT $1, tm.module_id, FALSE, 0
                FROM track_modules tm
                WHERE tm.track_id = $2
                ON CONFLICT (user_id, module_id) DO NOTHING
            `, [userId, trackId]);

            // Initialize checklist progress
            await pool.query(`
                INSERT INTO user_checklist_progress (user_id, checklist_item_id, is_completed)
                SELECT $1, id, FALSE
                FROM onboarding_checklist_items
                WHERE track_id = $2
                ON CONFLICT (user_id, checklist_item_id) DO NOTHING
            `, [userId, trackId]);
        }

        res.json({
            message: 'Track assigned successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Assign track error:', error);
        res.status(500).json({ error: 'Server error assigning track' });
    }
});

// GET /api/tracks/users-by-track - Get users grouped by track (admin)
router.get('/users-by-track', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                tt.id as track_id,
                tt.name as track_name,
                tt.display_name,
                json_agg(
                    json_build_object(
                        'id', u.id,
                        'name', u.name,
                        'email', u.email,
                        'is_certified', u.is_certified,
                        'hire_date', u.hire_date
                    )
                ) FILTER (WHERE u.id IS NOT NULL) as users,
                COUNT(u.id) as user_count
            FROM training_tracks tt
            LEFT JOIN users u ON u.training_track_id = tt.id
            WHERE tt.is_active = TRUE
            GROUP BY tt.id, tt.name, tt.display_name
            ORDER BY tt.id
        `);

        // Get unassigned users
        const unassigned = await pool.query(`
            SELECT id, name, email, is_certified, hire_date
            FROM users
            WHERE training_track_id IS NULL
        `);

        res.json({
            trackGroups: result.rows,
            unassignedUsers: unassigned.rows
        });
    } catch (error) {
        console.error('Get users by track error:', error);
        res.status(500).json({ error: 'Server error fetching users by track' });
    }
});

module.exports = router;
