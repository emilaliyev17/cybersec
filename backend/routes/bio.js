const express = require('express');
const multer = require('multer');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { uploadFile } = require('../services/storageService');

const router = express.Router();

// Multer config for photo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

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
    const { 
      bio_text, 
      job_title, 
      department, 
      location, 
      skills, 
      linkedin_url, 
      photo_url,
      credentials,
      projects,
      expertise
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO user_bios (
              user_id, bio_text, job_title, department, location, 
              skills, linkedin_url, photo_url, credentials, projects, expertise
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (user_id)
            DO UPDATE SET
                bio_text = EXCLUDED.bio_text,
                job_title = EXCLUDED.job_title,
                department = EXCLUDED.department,
                location = EXCLUDED.location,
                skills = EXCLUDED.skills,
                linkedin_url = EXCLUDED.linkedin_url,
                photo_url = EXCLUDED.photo_url,
                credentials = EXCLUDED.credentials,
                projects = EXCLUDED.projects,
                expertise = EXCLUDED.expertise,
                last_updated = CURRENT_TIMESTAMP
            RETURNING *
        `, [
          req.user.id, bio_text, job_title, department, location, 
          skills || [], linkedin_url, photo_url, credentials, 
          JSON.stringify(projects || []), expertise || []
        ]);

        res.json({
            message: 'Bio updated successfully',
            bio: result.rows[0]
        });
    } catch (error) {
        console.error('Update bio error:', error);
        res.status(500).json({ error: 'Server error updating bio' });
    }
});

// POST /api/bio/photo - Upload profile photo to GCS
router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const publicUrl = await uploadFile(req.file, 'bios');
    
    // Update photo_url in database immediately
    await pool.query(
      'UPDATE user_bios SET photo_url = $1, last_updated = CURRENT_TIMESTAMP WHERE user_id = $2',
      [publicUrl, req.user.id]
    );

    res.json({ photo_url: publicUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// GET /api/bio/status - Check if bio is complete
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT bio_text, job_title, department, expertise, projects FROM user_bios WHERE user_id = $1',
            [req.user.id]
        );

        const bio = result.rows[0];
        const isComplete = bio && 
                          bio.bio_text && bio.bio_text.trim().length > 0 &&
                          bio.expertise && bio.expertise.length === 5 &&
                          bio.projects && bio.projects.length >= 4;

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
