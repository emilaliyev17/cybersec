const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/bio - Get current user's bio
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_bios WHERE user_id = $1',
            [req.user.id]
        );

        res.json({ bio: result.rows[0] || null });
    } catch (error) {
        console.error('Get bio error:', error);
        res.status(500).json({ error: 'Server error fetching bio' });
    }
});

// PUT /api/bio - Update/Create user bio
router.put('/', authMiddleware, async (req, res) => {
    const { bio_text, job_title, department, location, skills, linkedin_url, photo_url } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO user_bios (user_id, bio_text, job_title, department, location, skills, linkedin_url, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id)
            DO UPDATE SET
                bio_text = EXCLUDED.bio_text,
                job_title = EXCLUDED.job_title,
                department = EXCLUDED.department,
                location = EXCLUDED.location,
                skills = EXCLUDED.skills,
                linkedin_url = EXCLUDED.linkedin_url,
                photo_url = EXCLUDED.photo_url,
                last_updated = CURRENT_TIMESTAMP
            RETURNING *
        `, [req.user.id, bio_text, job_title, department, location, skills || [], linkedin_url, photo_url]);

        res.json({
            message: 'Bio updated successfully',
            bio: result.rows[0]
        });
    } catch (error) {
        console.error('Update bio error:', error);
        res.status(500).json({ error: 'Server error updating bio' });
    }
});

// GET /api/bio/status - Check if bio is complete (for progress tracking)
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT bio_text, job_title, department FROM user_bios WHERE user_id = $1',
            [req.user.id]
        );

        const bio = result.rows[0];
        const isComplete = bio && bio.bio_text && bio.bio_text.trim().length > 0;

        res.json({
            isComplete,
            hasStarted: !!bio
        });
    } catch (error) {
        console.error('Get bio status error:', error);
        res.status(500).json({ error: 'Server error fetching bio status' });
    }
});

// DELETE /api/bio - Delete user bio
router.delete('/', authMiddleware, async (req, res) => {
    try {
        await pool.query('DELETE FROM user_bios WHERE user_id = $1', [req.user.id]);
        res.json({ message: 'Bio deleted successfully' });
    } catch (error) {
        console.error('Delete bio error:', error);
        res.status(500).json({ error: 'Server error deleting bio' });
    }
});

module.exports = router;
