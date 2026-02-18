const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Passing threshold constant
const PASSING_SCORE = 80;

// GET /api/quiz/questions - Get quiz questions
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    // First check if user has completed all modules
    const progressCheck = await pool.query(
      `SELECT
        COUNT(tm.id) as total_modules,
        COUNT(CASE WHEN up.is_completed THEN 1 END) as completed_modules
       FROM training_modules tm
       LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
       WHERE tm.is_active = TRUE`,
      [req.user.id]
    );

    const { total_modules, completed_modules } = progressCheck.rows[0];

    if (parseInt(completed_modules) < parseInt(total_modules)) {
      return res.status(403).json({
        error: 'You must complete all training modules before taking the quiz',
        completed: parseInt(completed_modules),
        total: parseInt(total_modules),
      });
    }

    // Get randomized questions (don't send correct answers to frontend)
    const result = await pool.query(
      `SELECT
        id,
        question_text,
        options_json,
        difficulty,
        module_id
       FROM quiz_questions
       WHERE is_active = TRUE
       ORDER BY RANDOM()
       LIMIT 15`
    );

    res.json({ questions: result.rows });
  } catch (error) {
    console.error('Get quiz questions error:', error);
    res.status(500).json({ error: 'Server error fetching questions' });
  }
});

// POST /api/quiz/submit - Submit quiz and handle 80% rule
router.post('/submit', authMiddleware, async (req, res) => {
  const { answers, time_taken_seconds } = req.body;

  // answers format: [{ question_id: number, selected_answer_index: number }, ...]

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Answers are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get correct answers for submitted questions
    const questionIds = answers.map((a) => a.question_id);
    const correctAnswersResult = await client.query(
      `SELECT id, correct_answer_index, explanation, question_text
       FROM quiz_questions
       WHERE id = ANY($1)`,
      [questionIds]
    );

    const correctAnswersMap = new Map(
      correctAnswersResult.rows.map((q) => [q.id, q])
    );

    // Calculate score
    let correctCount = 0;
    const detailedResults = [];

    for (const answer of answers) {
      const question = correctAnswersMap.get(answer.question_id);
      if (question) {
        const isCorrect = question.correct_answer_index === answer.selected_answer_index;
        if (isCorrect) correctCount++;

        detailedResults.push({
          question_id: answer.question_id,
          question_text: question.question_text,
          selected_answer: answer.selected_answer_index,
          correct_answer: question.correct_answer_index,
          is_correct: isCorrect,
          explanation: question.explanation,
        });
      }
    }

    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100 * 100) / 100;
    const passed = score >= PASSING_SCORE;

    // Get attempt number
    const attemptResult = await client.query(
      'SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt FROM quiz_attempts WHERE user_id = $1',
      [req.user.id]
    );
    const attemptNumber = attemptResult.rows[0].next_attempt;

    // Record the quiz attempt
    await client.query(
      `INSERT INTO quiz_attempts (user_id, score, total_questions, correct_answers, passed, attempt_number, time_taken_seconds, answers_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.id,
        score,
        totalQuestions,
        correctCount,
        passed,
        attemptNumber,
        time_taken_seconds || null,
        JSON.stringify(detailedResults),
      ]
    );

    if (passed) {
      // ==========================================
      // PASSED (Score >= 80%): Mark as Certified
      // ==========================================
      await client.query(
        `UPDATE users
         SET is_certified = TRUE, certification_date = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [req.user.id]
      );

      // Auto-complete checklist items with trigger 'quiz_passed'
      await client.query(`
        INSERT INTO user_checklist_items (user_checklist_id, template_item_id, is_completed, completed_at, completed_by)
        SELECT uc.id, cti.id, TRUE, CURRENT_TIMESTAMP, $1
        FROM user_checklists uc
        JOIN checklist_templates ct ON uc.template_id = ct.id
        JOIN checklist_sections cs ON ct.id = cs.template_id
        JOIN checklist_template_items cti ON cs.id = cti.section_id
        WHERE uc.user_id = $1
          AND uc.status != 'completed'
          AND cti.auto_complete_trigger = 'quiz_passed'
          AND cti.is_active = TRUE
          AND cs.is_active = TRUE
        ON CONFLICT (user_checklist_id, template_item_id)
        DO UPDATE SET
          is_completed = TRUE,
          completed_at = CURRENT_TIMESTAMP,
          completed_by = $1,
          updated_at = CURRENT_TIMESTAMP
      `, [req.user.id]);

      // Update checklist status if all items are now completed
      await client.query(`
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
          ELSE 'in_progress'
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

      await client.query('COMMIT');

      res.json({
        success: true,
        passed: true,
        score,
        correctCount,
        totalQuestions,
        attemptNumber,
        message: 'Congratulations! You have passed the security training assessment and are now certified.',
        certification_date: new Date().toISOString(),
        detailedResults,
      });
    } else {
      // ==========================================
      // FAILED (Score < 80%): Allow retake without reset
      // ==========================================

      await client.query('COMMIT');

      res.json({
        success: true,
        passed: false,
        score,
        correctCount,
        totalQuestions,
        attemptNumber,
        requiredScore: PASSING_SCORE,
        message: `You scored ${score}%, but ${PASSING_SCORE}% is required to pass. Please review the training materials and try again.`,
        detailedResults,
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Server error submitting quiz' });
  } finally {
    client.release();
  }
});

// GET /api/quiz/history - Get user's quiz attempt history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        score,
        total_questions,
        correct_answers,
        passed,
        attempt_number,
        time_taken_seconds,
        attempt_date
       FROM quiz_attempts
       WHERE user_id = $1
       ORDER BY attempt_date DESC`,
      [req.user.id]
    );

    res.json({ attempts: result.rows });
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Server error fetching quiz history' });
  }
});

// GET /api/quiz/stats - Get quiz statistics for admins
router.get('/stats', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN passed THEN 1 END) as passed_attempts,
        ROUND(AVG(score)::numeric, 2) as average_score,
        MIN(score) as lowest_score,
        MAX(score) as highest_score,
        COUNT(DISTINCT user_id) as unique_users
       FROM quiz_attempts`
    );

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ error: 'Server error fetching quiz stats' });
  }
});

// GET /api/quiz/can-take - Check if user can take the quiz
router.get('/can-take', authMiddleware, async (req, res) => {
  try {
    // Check if user has completed all modules
    const progressCheck = await pool.query(
      `SELECT
        COUNT(tm.id) as total_modules,
        COUNT(CASE WHEN up.is_completed THEN 1 END) as completed_modules
       FROM training_modules tm
       LEFT JOIN user_progress up ON tm.id = up.module_id AND up.user_id = $1
       WHERE tm.is_active = TRUE`,
      [req.user.id]
    );

    const { total_modules, completed_modules } = progressCheck.rows[0];
    const canTakeQuiz = parseInt(completed_modules) >= parseInt(total_modules);

    // Check certification status
    const certResult = await pool.query(
      'SELECT is_certified, certification_date FROM users WHERE id = $1',
      [req.user.id]
    );

    const { is_certified, certification_date } = certResult.rows[0];

    res.json({
      canTakeQuiz,
      completedModules: parseInt(completed_modules),
      totalModules: parseInt(total_modules),
      isCertified: is_certified,
      certificationDate: certification_date,
    });
  } catch (error) {
    console.error('Check quiz eligibility error:', error);
    res.status(500).json({ error: 'Server error checking quiz eligibility' });
  }
});

module.exports = router;
