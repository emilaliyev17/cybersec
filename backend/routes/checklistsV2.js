const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// DIAGNOSTIC ENDPOINT - Remove in production
// ============================================
router.get('/admin/diagnose', adminMiddleware, async (req, res) => {
    try {
        // 1. Check templates
        const templates = await pool.query(`
            SELECT id, template_id, name, is_active FROM checklist_templates
        `);

        // 2. Check sections per template
        const sections = await pool.query(`
            SELECT
                ct.template_id,
                ct.name as template_name,
                COUNT(cs.id) as section_count
            FROM checklist_templates ct
            LEFT JOIN checklist_sections cs ON ct.id = cs.template_id
            GROUP BY ct.id, ct.template_id, ct.name
        `);

        // 3. Check items per template
        const items = await pool.query(`
            SELECT
                ct.template_id,
                ct.name as template_name,
                COUNT(cti.id) as item_count
            FROM checklist_templates ct
            LEFT JOIN checklist_sections cs ON ct.id = cs.template_id
            LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id
            GROUP BY ct.id, ct.template_id, ct.name
        `);

        // 4. Check user_checklists
        const userChecklists = await pool.query(`
            SELECT
                uc.id as user_checklist_id,
                u.email,
                ct.template_id,
                ct.name as template_name,
                uc.status
            FROM user_checklists uc
            JOIN users u ON uc.user_id = u.id
            JOIN checklist_templates ct ON uc.template_id = ct.id
        `);

        // 5. Check user_checklist_items for each user_checklist
        const userItems = await pool.query(`
            SELECT
                uc.id as user_checklist_id,
                u.email,
                COUNT(uci.id) as items_in_user_checklist_items,
                COUNT(CASE WHEN uci.is_completed THEN 1 END) as completed_count
            FROM user_checklists uc
            JOIN users u ON uc.user_id = u.id
            LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id
            GROUP BY uc.id, u.email
        `);

        // 6. Check if items were initialized correctly
        const itemsComparison = await pool.query(`
            SELECT
                uc.id as user_checklist_id,
                u.email,
                ct.name as template_name,
                (SELECT COUNT(*) FROM checklist_sections cs
                 JOIN checklist_template_items cti ON cs.id = cti.section_id
                 WHERE cs.template_id = ct.id AND cs.is_active = TRUE AND cti.is_active = TRUE
                ) as expected_items,
                (SELECT COUNT(*) FROM user_checklist_items uci WHERE uci.user_checklist_id = uc.id) as actual_items
            FROM user_checklists uc
            JOIN users u ON uc.user_id = u.id
            JOIN checklist_templates ct ON uc.template_id = ct.id
        `);

        res.json({
            diagnosis: {
                templates: templates.rows,
                sections_per_template: sections.rows,
                items_per_template: items.rows,
                user_checklists: userChecklists.rows,
                user_checklist_items: userItems.rows,
                items_comparison: itemsComparison.rows
            },
            summary: {
                total_templates: templates.rows.length,
                total_user_checklists: userChecklists.rows.length,
                checklists_with_missing_items: itemsComparison.rows.filter(r =>
                    parseInt(r.expected_items) !== parseInt(r.actual_items)
                )
            }
        });
    } catch (error) {
        console.error('Diagnose error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/v2/checklists/admin/fix-items - Reinitialize missing items for all checklists
router.post('/admin/fix-items', adminMiddleware, async (req, res) => {
    try {
        // Find checklists with missing items
        const checklistsToFix = await pool.query(`
            SELECT
                uc.id as user_checklist_id,
                uc.template_id,
                u.email,
                ct.name as template_name
            FROM user_checklists uc
            JOIN users u ON uc.user_id = u.id
            JOIN checklist_templates ct ON uc.template_id = ct.id
            WHERE (
                SELECT COUNT(*) FROM user_checklist_items uci WHERE uci.user_checklist_id = uc.id
            ) < (
                SELECT COUNT(*) FROM checklist_sections cs
                JOIN checklist_template_items cti ON cs.id = cti.section_id
                WHERE cs.template_id = ct.id AND cs.is_active = TRUE AND cti.is_active = TRUE
            )
        `);

        const fixed = [];

        for (const checklist of checklistsToFix.rows) {
            // Insert missing items (ON CONFLICT DO NOTHING will skip existing)
            const result = await pool.query(`
                INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed)
                SELECT $1, cti.id, FALSE
                FROM checklist_sections cs
                JOIN checklist_template_items cti ON cs.id = cti.section_id
                WHERE cs.template_id = $2 AND cs.is_active = TRUE AND cti.is_active = TRUE
                ON CONFLICT (user_checklist_id, template_item_id) DO NOTHING
            `, [checklist.user_checklist_id, checklist.template_id]);

            fixed.push({
                user_checklist_id: checklist.user_checklist_id,
                email: checklist.email,
                template: checklist.template_name,
                items_inserted: result.rowCount
            });
        }

        res.json({
            message: `Fixed ${fixed.length} checklists`,
            fixed
        });
    } catch (error) {
        console.error('Fix items error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// USER ENDPOINTS
// ============================================

// GET /api/checklists/templates - Get all available checklist templates
router.get('/templates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ct.id,
                ct.template_id,
                ct.name,
                ct.description,
                ct.audience,
                ct.trigger_event,
                COUNT(DISTINCT cs.id) as section_count,
                COUNT(cti.id) as item_count
            FROM checklist_templates ct
            LEFT JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
            LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            WHERE ct.is_active = TRUE
            GROUP BY ct.id
            ORDER BY ct.id
        `);

        res.json({ templates: result.rows });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Server error fetching templates' });
    }
});

// GET /api/checklists/my - Get user's assigned checklists
router.get('/my', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                uc.id,
                uc.status,
                uc.assigned_at,
                uc.due_date,
                uc.completed_at,
                ct.template_id,
                ct.name as checklist_name,
                ct.description,
                assigner.name as assigned_by_name,
                COUNT(cti.id) as total_items,
                COUNT(CASE WHEN uci.is_completed THEN 1 END) as completed_items
            FROM user_checklists uc
            JOIN checklist_templates ct ON uc.template_id = ct.id
            LEFT JOIN users assigner ON uc.assigned_by = assigner.id
            LEFT JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
            LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id AND cti.id = uci.template_item_id
            WHERE uc.user_id = $1
            GROUP BY uc.id, ct.template_id, ct.name, ct.description, assigner.name
            ORDER BY
                CASE uc.status
                    WHEN 'in_progress' THEN 1
                    WHEN 'not_started' THEN 2
                    WHEN 'completed' THEN 3
                END,
                uc.due_date NULLS LAST,
                uc.assigned_at DESC
        `, [req.user.id]);

        res.json({ checklists: result.rows });
    } catch (error) {
        console.error('Get my checklists error:', error);
        res.status(500).json({ error: 'Server error fetching checklists' });
    }
});

// GET /api/checklists/:checklistId - Get specific checklist with all items
router.get('/:checklistId', async (req, res) => {
    const { checklistId } = req.params;

    try {
        // Get checklist info
        const checklistResult = await pool.query(`
            SELECT
                uc.id,
                uc.user_id,
                uc.status,
                uc.assigned_at,
                uc.due_date,
                uc.completed_at,
                uc.notes,
                ct.id as template_db_id,
                ct.template_id,
                ct.name as checklist_name,
                ct.description,
                assigner.name as assigned_by_name
            FROM user_checklists uc
            JOIN checklist_templates ct ON uc.template_id = ct.id
            LEFT JOIN users assigner ON uc.assigned_by = assigner.id
            WHERE uc.id = $1
        `, [checklistId]);

        if (checklistResult.rows.length === 0) {
            return res.status(404).json({ error: 'Checklist not found' });
        }

        const checklist = checklistResult.rows[0];

        // Check authorization - user can only view their own checklists (or admin)
        if (checklist.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get sections with items
        const sectionsResult = await pool.query(`
            SELECT
                cs.id as section_id,
                cs.title as section_title,
                cs.description as section_description,
                cs.section_order,
                json_agg(
                    json_build_object(
                        'id', cti.id,
                        'title', cti.title,
                        'description', cti.description,
                        'subsection', cti.subsection,
                        'item_order', cti.item_order,
                        'is_mandatory', cti.is_mandatory,
                        'auto_complete_trigger', cti.auto_complete_trigger,
                        'is_completed', COALESCE(uci.is_completed, FALSE),
                        'completed_at', uci.completed_at,
                        'completed_by', completer.name,
                        'notes', uci.notes
                    ) ORDER BY cti.item_order
                ) FILTER (WHERE cti.id IS NOT NULL) as items
            FROM checklist_sections cs
            LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            LEFT JOIN user_checklist_items uci ON cti.id = uci.template_item_id AND uci.user_checklist_id = $1
            LEFT JOIN users completer ON uci.completed_by = completer.id
            WHERE cs.template_id = $2 AND cs.is_active = TRUE
            GROUP BY cs.id, cs.title, cs.description, cs.section_order
            ORDER BY cs.section_order
        `, [checklistId, checklist.template_db_id]);

        // Calculate progress
        let totalItems = 0;
        let completedItems = 0;
        sectionsResult.rows.forEach(section => {
            if (section.items) {
                totalItems += section.items.length;
                completedItems += section.items.filter(item => item.is_completed).length;
            }
        });

        res.json({
            checklist: {
                ...checklist,
                total_items: totalItems,
                completed_items: completedItems,
                completion_percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
            },
            sections: sectionsResult.rows
        });
    } catch (error) {
        console.error('Get checklist error:', error);
        res.status(500).json({ error: 'Server error fetching checklist' });
    }
});

// PUT /api/checklists/:checklistId/items/:itemId - Update item completion
router.put('/:checklistId/items/:itemId', async (req, res) => {
    const { checklistId, itemId } = req.params;
    const { is_completed, notes } = req.body;

    try {
        // Verify ownership
        const verifyResult = await pool.query(`
            SELECT uc.id, uc.user_id, uc.status
            FROM user_checklists uc
            WHERE uc.id = $1
        `, [checklistId]);

        if (verifyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Checklist not found' });
        }

        const checklist = verifyResult.rows[0];

        // Check authorization
        if (checklist.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Update or insert item progress
        const result = await pool.query(`
            INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed, completed_at, completed_by, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_checklist_id, template_item_id)
            DO UPDATE SET
                is_completed = EXCLUDED.is_completed,
                completed_at = CASE WHEN EXCLUDED.is_completed THEN CURRENT_TIMESTAMP ELSE NULL END,
                completed_by = CASE WHEN EXCLUDED.is_completed THEN EXCLUDED.completed_by ELSE NULL END,
                notes = COALESCE(EXCLUDED.notes, user_checklist_items.notes),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [checklistId, itemId, is_completed, is_completed ? new Date() : null, req.user.id, notes]);

        // Check if all items are now completed and update checklist status
        const progressResult = await pool.query(`
            SELECT
                COUNT(cti.id) as total,
                COUNT(CASE WHEN uci.is_completed THEN 1 END) as completed
            FROM user_checklists uc
            JOIN checklist_templates ct ON uc.template_id = ct.id
            JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
            JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id AND cti.id = uci.template_item_id
            WHERE uc.id = $1
        `, [checklistId]);

        const { total, completed } = progressResult.rows[0];
        let newStatus = checklist.status;

        if (parseInt(completed) === parseInt(total)) {
            newStatus = 'completed';
            await pool.query(`
                UPDATE user_checklists
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [checklistId]);
        } else if (parseInt(completed) > 0 && checklist.status === 'not_started') {
            newStatus = 'in_progress';
            await pool.query(`
                UPDATE user_checklists
                SET status = 'in_progress'
                WHERE id = $1
            `, [checklistId]);
        }

        res.json({
            message: 'Item updated',
            item: result.rows[0],
            checklist_status: newStatus,
            progress: {
                total: parseInt(total),
                completed: parseInt(completed),
                percentage: Math.round((parseInt(completed) / parseInt(total)) * 100)
            }
        });
    } catch (error) {
        console.error('Update checklist item error:', error);
        res.status(500).json({ error: 'Server error updating item' });
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// GET /api/checklists/admin/templates - Get all templates with full structure (admin)
router.get('/admin/templates', adminMiddleware, async (req, res) => {
    try {
        const templatesResult = await pool.query(`
            SELECT
                ct.*,
                (SELECT COUNT(*) FROM user_checklists uc WHERE uc.template_id = ct.id) as assigned_count
            FROM checklist_templates ct
            ORDER BY ct.id
        `);

        const templates = [];

        for (const template of templatesResult.rows) {
            const sectionsResult = await pool.query(`
                SELECT
                    cs.id,
                    cs.title,
                    cs.description,
                    cs.section_order,
                    json_agg(
                        json_build_object(
                            'id', cti.id,
                            'title', cti.title,
                            'description', cti.description,
                            'subsection', cti.subsection,
                            'item_order', cti.item_order,
                            'is_mandatory', cti.is_mandatory,
                            'auto_complete_trigger', cti.auto_complete_trigger
                        ) ORDER BY cti.item_order
                    ) FILTER (WHERE cti.id IS NOT NULL) as items
                FROM checklist_sections cs
                LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
                WHERE cs.template_id = $1 AND cs.is_active = TRUE
                GROUP BY cs.id
                ORDER BY cs.section_order
            `, [template.id]);

            templates.push({
                ...template,
                sections: sectionsResult.rows
            });
        }

        res.json({ templates });
    } catch (error) {
        console.error('Get admin templates error:', error);
        res.status(500).json({ error: 'Server error fetching templates' });
    }
});

// POST /api/checklists/admin/assign - Assign checklist to user(s)
router.post('/admin/assign', adminMiddleware, async (req, res) => {
    const { user_ids, template_id, due_date, period_label } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({ error: 'user_ids array is required' });
    }

    if (!template_id) {
        return res.status(400).json({ error: 'template_id is required' });
    }

    try {
        // Verify template exists
        const templateCheck = await pool.query(
            'SELECT id, is_recurring FROM checklist_templates WHERE template_id = $1 OR id = $2',
            [template_id, template_id]
        );

        if (templateCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const templateDbId = templateCheck.rows[0].id;
        const isRecurring = templateCheck.rows[0].is_recurring;
        const assignedChecklists = [];

        for (const userId of user_ids) {
            // Check if user already has this checklist assigned (not completed) for this period
            let existingCheck;
            if (period_label) {
                existingCheck = await pool.query(`
                    SELECT id FROM user_checklists
                    WHERE user_id = $1 AND template_id = $2 AND period_label = $3
                `, [userId, templateDbId, period_label]);
            } else {
                existingCheck = await pool.query(`
                    SELECT id FROM user_checklists
                    WHERE user_id = $1 AND template_id = $2 AND status != 'completed' AND period_label IS NULL
                `, [userId, templateDbId]);
            }

            if (existingCheck.rows.length > 0) {
                continue; // Skip if already assigned
            }

            // Create checklist assignment
            const result = await pool.query(`
                INSERT INTO user_checklists (user_id, template_id, assigned_by, due_date, period_label)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [userId, templateDbId, req.user.id, due_date || null, period_label || null]);

            const checklistId = result.rows[0].id;

            // Initialize all items for this checklist
            await pool.query(`
                INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed)
                SELECT $1, cti.id, FALSE
                FROM checklist_sections cs
                JOIN checklist_template_items cti ON cs.id = cti.section_id
                WHERE cs.template_id = $2 AND cs.is_active = TRUE AND cti.is_active = TRUE
            `, [checklistId, templateDbId]);

            assignedChecklists.push(result.rows[0]);
        }

        res.json({
            message: `Checklist assigned to ${assignedChecklists.length} user(s)`,
            assigned: assignedChecklists
        });
    } catch (error) {
        console.error('Assign checklist error:', error);
        res.status(500).json({ error: 'Server error assigning checklist' });
    }
});

// GET /api/checklists/admin/overview - Get all users' checklist progress
router.get('/admin/overview', adminMiddleware, async (req, res) => {
    const { status, template_id, overdue, debug } = req.query;

    try {
        // Debug mode: log raw counts to help diagnose progress issues
        if (debug === 'true') {
            const debugResult = await pool.query(`
                SELECT
                    uc.id as checklist_id,
                    u.email,
                    ct.name as template_name,
                    (SELECT COUNT(*) FROM checklist_sections cs2
                     JOIN checklist_template_items cti2 ON cs2.id = cti2.section_id
                     WHERE cs2.template_id = ct.id AND cs2.is_active = TRUE AND cti2.is_active = TRUE) as template_items_count,
                    (SELECT COUNT(*) FROM user_checklist_items uci2 WHERE uci2.user_checklist_id = uc.id) as user_items_total,
                    (SELECT COUNT(*) FROM user_checklist_items uci2 WHERE uci2.user_checklist_id = uc.id AND uci2.is_completed = TRUE) as user_items_completed
                FROM user_checklists uc
                JOIN users u ON uc.user_id = u.id
                JOIN checklist_templates ct ON uc.template_id = ct.id
                ORDER BY u.email
            `);
            console.log('[DEBUG] Admin overview - Raw checklist data:');
            debugResult.rows.forEach(row => {
                console.log(`  - ${row.email}: ${row.template_name} | Template items: ${row.template_items_count} | User items: ${row.user_items_total}/${row.user_items_completed} completed`);
            });
        }

        let query = `
            SELECT
                uc.id,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                ct.template_id,
                ct.name as checklist_name,
                uc.status,
                uc.assigned_at,
                uc.due_date,
                uc.completed_at,
                assigner.name as assigned_by_name,
                uc.target_user_id,
                target_user.name as target_user_name,
                target_user.email as target_user_email,
                COUNT(cti.id) as total_items,
                COUNT(CASE WHEN uci.is_completed THEN 1 END) as completed_items,
                CASE
                    WHEN uc.due_date < CURRENT_DATE AND uc.status != 'completed' THEN TRUE
                    ELSE FALSE
                END as is_overdue
            FROM user_checklists uc
            JOIN users u ON uc.user_id = u.id
            JOIN checklist_templates ct ON uc.template_id = ct.id
            LEFT JOIN users assigner ON uc.assigned_by = assigner.id
            LEFT JOIN users target_user ON uc.target_user_id = target_user.id
            LEFT JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
            LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id AND cti.id = uci.template_item_id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            params.push(status);
            query += ` AND uc.status = $${params.length}`;
        }

        if (template_id) {
            params.push(template_id);
            query += ` AND ct.template_id = $${params.length}`;
        }

        if (overdue === 'true') {
            query += ` AND uc.due_date < CURRENT_DATE AND uc.status != 'completed'`;
        }

        query += `
            GROUP BY uc.id, u.id, u.name, u.email, u.role, ct.template_id, ct.name,
                     uc.status, uc.assigned_at, uc.due_date, uc.completed_at, assigner.name,
                     uc.target_user_id, target_user.name, target_user.email
            ORDER BY
                CASE uc.status
                    WHEN 'in_progress' THEN 1
                    WHEN 'not_started' THEN 2
                    WHEN 'completed' THEN 3
                END,
                uc.due_date NULLS LAST,
                uc.assigned_at DESC
        `;

        const result = await pool.query(query, params);

        // Add completion percentage
        const checklists = result.rows.map(row => ({
            ...row,
            completion_percentage: row.total_items > 0
                ? Math.round((row.completed_items / row.total_items) * 100)
                : 0
        }));

        res.json({ checklists });
    } catch (error) {
        console.error('Get overview error:', error);
        res.status(500).json({ error: 'Server error fetching overview' });
    }
});

// GET /api/checklists/admin/stats - Get checklist statistics for dashboard
router.get('/admin/stats', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM user_checklists) as total_assigned,
                (SELECT COUNT(*) FROM user_checklists WHERE status = 'not_started') as not_started,
                (SELECT COUNT(*) FROM user_checklists WHERE status = 'in_progress') as in_progress,
                (SELECT COUNT(*) FROM user_checklists WHERE status = 'completed') as completed,
                (SELECT COUNT(*) FROM user_checklists WHERE due_date < CURRENT_DATE AND status != 'completed') as overdue,
                (SELECT COUNT(*) FROM user_checklists WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days') as completed_last_week
        `);

        // Get by template breakdown
        const templateStats = await pool.query(`
            SELECT
                ct.template_id,
                ct.name,
                COUNT(uc.id) as assigned,
                COUNT(CASE WHEN uc.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN uc.due_date < CURRENT_DATE AND uc.status != 'completed' THEN 1 END) as overdue
            FROM checklist_templates ct
            LEFT JOIN user_checklists uc ON ct.id = uc.template_id
            GROUP BY ct.id, ct.template_id, ct.name
            ORDER BY ct.id
        `);

        res.json({
            stats: result.rows[0],
            by_template: templateStats.rows
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
});

// PUT /api/checklists/admin/items/:checklistId/:itemId - Admin update item
router.put('/admin/items/:checklistId/:itemId', adminMiddleware, async (req, res) => {
    const { checklistId, itemId } = req.params;
    const { is_completed, notes } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed, completed_at, completed_by, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_checklist_id, template_item_id)
            DO UPDATE SET
                is_completed = EXCLUDED.is_completed,
                completed_at = CASE WHEN EXCLUDED.is_completed THEN CURRENT_TIMESTAMP ELSE NULL END,
                completed_by = CASE WHEN EXCLUDED.is_completed THEN EXCLUDED.completed_by ELSE NULL END,
                notes = COALESCE(EXCLUDED.notes, user_checklist_items.notes),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [checklistId, itemId, is_completed, is_completed ? new Date() : null, req.user.id, notes]);

        // Update checklist status if needed
        const progressResult = await pool.query(`
            SELECT
                COUNT(cti.id) as total,
                COUNT(CASE WHEN uci.is_completed THEN 1 END) as completed
            FROM user_checklists uc
            JOIN checklist_templates ct ON uc.template_id = ct.id
            JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
            JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id AND cti.id = uci.template_item_id
            WHERE uc.id = $1
        `, [checklistId]);

        const { total, completed } = progressResult.rows[0];

        if (parseInt(completed) === parseInt(total)) {
            await pool.query(`
                UPDATE user_checklists SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1
            `, [checklistId]);
        } else if (parseInt(completed) > 0) {
            await pool.query(`
                UPDATE user_checklists SET status = 'in_progress', completed_at = NULL WHERE id = $1
            `, [checklistId]);
        }

        res.json({ message: 'Item updated by admin', item: result.rows[0] });
    } catch (error) {
        console.error('Admin update item error:', error);
        res.status(500).json({ error: 'Server error updating item' });
    }
});

// ============================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ============================================

// PUT /api/v2/checklists/admin/templates/:templateId - Update template name
router.put('/admin/templates/:templateId', adminMiddleware, async (req, res) => {
    const { templateId } = req.params;
    const { name, description, audience, trigger_event } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const result = await pool.query(`
            UPDATE checklist_templates
            SET name = $1, description = $2, audience = $3, trigger_event = $4
            WHERE id = $5
            RETURNING *
        `, [name.trim(), description || null, audience || null, trigger_event || null, templateId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({
            message: 'Template updated',
            template: result.rows[0]
        });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Server error updating template' });
    }
});

// ============================================
// SECTION MANAGEMENT ENDPOINTS
// ============================================

// PUT /api/v2/checklists/admin/sections/:sectionId - Update section title
router.put('/admin/sections/:sectionId', adminMiddleware, async (req, res) => {
    const { sectionId } = req.params;
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await pool.query(`
            UPDATE checklist_sections
            SET title = $1, description = $2
            WHERE id = $3
            RETURNING *
        `, [title.trim(), description || null, sectionId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Section not found' });
        }

        res.json({
            message: 'Section updated',
            section: result.rows[0]
        });
    } catch (error) {
        console.error('Update section error:', error);
        res.status(500).json({ error: 'Server error updating section' });
    }
});

// POST /api/v2/checklists/admin/sections - Create new section
router.post('/admin/sections', adminMiddleware, async (req, res) => {
    const { template_id, title, description } = req.body;

    if (!template_id || !title || title.trim() === '') {
        return res.status(400).json({ error: 'template_id and title are required' });
    }

    try {
        // Get the max section_order for this template
        const orderResult = await pool.query(`
            SELECT COALESCE(MAX(section_order), 0) + 1 as next_order
            FROM checklist_sections
            WHERE template_id = $1
        `, [template_id]);

        const nextOrder = orderResult.rows[0].next_order;

        const result = await pool.query(`
            INSERT INTO checklist_sections (template_id, title, description, section_order)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [template_id, title.trim(), description || null, nextOrder]);

        res.json({
            message: 'Section created',
            section: result.rows[0]
        });
    } catch (error) {
        console.error('Create section error:', error);
        res.status(500).json({ error: 'Server error creating section' });
    }
});

// DELETE /api/v2/checklists/admin/sections/:sectionId - Delete section
router.delete('/admin/sections/:sectionId', adminMiddleware, async (req, res) => {
    const { sectionId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM checklist_sections WHERE id = $1 RETURNING id',
            [sectionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Section not found' });
        }

        res.json({ message: 'Section deleted' });
    } catch (error) {
        console.error('Delete section error:', error);
        res.status(500).json({ error: 'Server error deleting section' });
    }
});

// ============================================
// TEMPLATE ITEM MANAGEMENT ENDPOINTS
// ============================================

// PUT /api/v2/checklists/admin/template-items/:itemId - Update template item
router.put('/admin/template-items/:itemId', adminMiddleware, async (req, res) => {
    const { itemId } = req.params;
    const { title, description, subsection, is_mandatory } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await pool.query(`
            UPDATE checklist_template_items
            SET title = $1, description = $2, subsection = $3, is_mandatory = $4
            WHERE id = $5
            RETURNING *
        `, [title.trim(), description || null, subsection || null, is_mandatory || false, itemId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({
            message: 'Item updated',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Update template item error:', error);
        res.status(500).json({ error: 'Server error updating item' });
    }
});

// POST /api/v2/checklists/admin/template-items - Create new template item
router.post('/admin/template-items', adminMiddleware, async (req, res) => {
    const { section_id, title, description, subsection, is_mandatory } = req.body;

    if (!section_id || !title || title.trim() === '') {
        return res.status(400).json({ error: 'section_id and title are required' });
    }

    try {
        // Get the max item_order for this section
        const orderResult = await pool.query(`
            SELECT COALESCE(MAX(item_order), 0) + 1 as next_order
            FROM checklist_template_items
            WHERE section_id = $1
        `, [section_id]);

        const nextOrder = orderResult.rows[0].next_order;

        const result = await pool.query(`
            INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [section_id, title.trim(), description || null, subsection || null, nextOrder, is_mandatory || false]);

        res.json({
            message: 'Item created',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Create template item error:', error);
        res.status(500).json({ error: 'Server error creating item' });
    }
});

// DELETE /api/v2/checklists/admin/template-items/:itemId - Delete template item
router.delete('/admin/template-items/:itemId', adminMiddleware, async (req, res) => {
    const { itemId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM checklist_template_items WHERE id = $1 RETURNING id',
            [itemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Delete template item error:', error);
        res.status(500).json({ error: 'Server error deleting item' });
    }
});

// DELETE /api/checklists/admin/:checklistId - Remove checklist assignment
router.delete('/admin/:checklistId', adminMiddleware, async (req, res) => {
    const { checklistId } = req.params;

    try {
        const result = await pool.query('DELETE FROM user_checklists WHERE id = $1 RETURNING id', [checklistId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Checklist not found' });
        }

        res.json({ message: 'Checklist assignment removed' });
    } catch (error) {
        console.error('Delete checklist error:', error);
        res.status(500).json({ error: 'Server error removing checklist' });
    }
});

// GET /api/checklists/admin/export - Export checklist progress as CSV
router.get('/admin/export', adminMiddleware, async (req, res) => {
    const { template_id } = req.query;

    try {
        let query = `
            SELECT
                u.name as "User Name",
                u.email as "Email",
                ct.name as "Checklist",
                uc.status as "Status",
                uc.assigned_at as "Assigned At",
                uc.due_date as "Due Date",
                uc.completed_at as "Completed At",
                COUNT(cti.id) as "Total Items",
                COUNT(CASE WHEN uci.is_completed THEN 1 END) as "Completed Items",
                ROUND((COUNT(CASE WHEN uci.is_completed THEN 1 END)::DECIMAL / NULLIF(COUNT(cti.id), 0)) * 100, 2) as "Completion %"
            FROM user_checklists uc
            JOIN users u ON uc.user_id = u.id
            JOIN checklist_templates ct ON uc.template_id = ct.id
            LEFT JOIN checklist_sections cs ON ct.id = cs.template_id AND cs.is_active = TRUE
            LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id AND cti.is_active = TRUE
            LEFT JOIN user_checklist_items uci ON uc.id = uci.user_checklist_id AND cti.id = uci.template_item_id
        `;

        const params = [];

        if (template_id) {
            params.push(template_id);
            query += ` WHERE ct.template_id = $1`;
        }

        query += `
            GROUP BY u.name, u.email, ct.name, uc.status, uc.assigned_at, uc.due_date, uc.completed_at
            ORDER BY u.name, ct.name
        `;

        const result = await pool.query(query, params);

        // Generate CSV
        if (result.rows.length === 0) {
            return res.status(200).send('No data to export');
        }

        const headers = Object.keys(result.rows[0]);
        const csvRows = [headers.join(',')];

        for (const row of result.rows) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null) return '';
                if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
                return val;
            });
            csvRows.push(values.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=checklist-progress.csv');
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Server error exporting data' });
    }
});

module.exports = router;
