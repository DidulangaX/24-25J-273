//SkillForge\backend\services\adaptive\routes\adaptiveRoutes.js


const express = require('express');
const router = express.Router();
const adaptiveController = require('../controllers/adaptiveController');
const AdaptiveUserPerformance = require('../models/UserPerformanceModel');
const challengeController = require('../controllers/challengeController');


// 1) create a new attempt
router.post('/newAttempt', adaptiveController.createNewAttempt);


// GET current question: /api/adaptive/currentQuestion?user_id=xxx
router.get('/currentQuestion', adaptiveController.getCurrentQuestion);

// POST answer: /api/adaptive/answer
router.post('/answer', adaptiveController.submitAnswer);

// In adaptiveRoutes.js (or a new file):
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await AdaptiveUserPerformance.find()
      .sort({ total_score: -1 })
      .limit(10)
      .select('user_id total_score badge');  // <--- ensure we select 'badge'

    res.json(topUsers);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  // -------------------------
// CHALLENGE endpoints
// -------------------------

// 1) Create a new challenge session
// POST /api/adaptive/challenge/create
router.post('/challenge/create', challengeController.createChallengeSession);

// GET /api/adaptive/challenge/pending?user=<username>
router.get('/challenge/pending', challengeController.getUserPendingChallenges);

// POST /api/adaptive/challenge/:sessionId/accept
router.post('/challenge/:sessionId/accept', challengeController.acceptChallenge);

// 2) Get a challenge session by ID
// GET /api/adaptive/challenge/:sessionId
router.get('/challenge/:sessionId', challengeController.getChallengeSession);

// At the bottom of SkillForge/backend/services/adaptive/routes/adaptiveRoutes.js
const challengeSubmissionController = require('../controllers/challengeSubmissionController');

// POST endpoint to submit a challenge answer
// URL: /api/adaptive/challenge/:sessionId/submit
router.post('/challenge/:sessionId/submit', challengeSubmissionController.submitChallengeAnswer);

// GET endpoint to retrieve a participant’s submission for a given challenge session
// URL: /api/adaptive/challenge/:sessionId/submission/:participant
router.get('/challenge/:sessionId/submission/:participant', challengeSubmissionController.getChallengeSubmission);

// GET endpoint to finalize and retrieve challenge results
router.get('/challenge/:sessionId/results', challengeController.finalizeChallengeSession);


// 4) final summary for a specific attempt
router.get('/finalSummary', adaptiveController.getFinalSummary);

// 5) see all attempts
router.get('/allAttempts', adaptiveController.getAllAttemptsForUser);


module.exports = router;
