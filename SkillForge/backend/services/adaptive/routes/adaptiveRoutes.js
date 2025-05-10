// File: backend/services/adaptive/routes/adaptiveRoutes.js

const express = require('express');
const router = express.Router();

// Import your controllers for normal adaptive endpoints
const adaptiveController = require('../controllers/adaptiveController');

// Import your controllers for challenge endpoints
const challengeController = require('../controllers/challengeController');
const challengeSubmissionController = require('../controllers/challengeSubmissionController');

// Import the TestSession model for the leaderboard
const TestSession = require('../models/TestSessionModel'); 
// ^^^ Make sure this path matches the actual file name:
// e.g. if your model file is named "TestSession.js", then:
// const TestSession = require('../models/TestSession');

// -------------------------
// Adaptive endpoints
// -------------------------

// 1) Create a new attempt
//    POST /api/adaptive/newAttempt
router.post('/newAttempt', adaptiveController.createNewAttempt);

// 2) Get current question
//    GET /api/adaptive/currentQuestion?user_id=xxx
router.get('/currentQuestion', adaptiveController.getCurrentQuestion);

// 3) Submit an answer
//    POST /api/adaptive/answer
router.post('/answer', adaptiveController.submitAnswer);

// 4) Round summary endpoints
//    GET /api/adaptive/roundSummary?user_id=xxx&roundNumber=1
router.get('/roundSummary', adaptiveController.getRoundSummary);

// 5) Final summary
//    GET /api/adaptive/finalSummary?user_id=xxx&attemptNumber=yyy
router.get('/finalSummary', adaptiveController.getFinalSummary);

// 6) List all attempts for a user
//    GET /api/adaptive/allAttempts?user_id=xxx
router.get('/allAttempts', adaptiveController.getAllAttemptsForUser);

// -------------------------
// Leaderboard endpoint
// -------------------------

// GET /api/adaptive/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // If you want each user's highest-scoring finished attempt:
    // 1) Filter only 'finished' sessions
    // 2) Sort by total_score descending
    // 3) Group by user_id to pick the doc with the highest score
    // 4) Limit to top 10
    // 5) Project only the fields you need

    // Example: Show *every* finished attempt (not grouping by user):
    // const topUsers = await TestSession.find({ phase: 'finished' })
    //   .sort({ total_score: -1 })
    //   .limit(10)
    //   .select('user_id total_score badge attemptNumber');

    // Or group each user's best attempt:
    const topUsers = await TestSession.aggregate([
      { $match: { phase: 'finished' } },
      { $sort: { total_score: -1 } },
      {
        $group: {
          _id: '$user_id',           // group by user_id
          doc: { $first: '$$ROOT' }, // the doc with the highest score
        },
      },
      { $limit: 10 },
      {
        $project: {
          user_id: '$doc.user_id',
          total_score: '$doc.total_score',
          badge: '$doc.badge',
          attemptNumber: '$doc.attemptNumber',
          _id: 0,
        },
      },
    ]);

    // Return the data
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
//    POST /api/adaptive/challenge/create
router.post('/challenge/create', challengeController.createChallengeSession);

// 2) Get user’s pending challenges
//    GET /api/adaptive/challenge/pending?user=xxx
router.get('/challenge/pending', challengeController.getUserPendingChallenges);

// 3) Accept a challenge
//    POST /api/adaptive/challenge/:sessionId/accept
router.post('/challenge/:sessionId/accept', challengeController.acceptChallenge);

// 4) Get a challenge session by ID
//    GET /api/adaptive/challenge/:sessionId
router.get('/challenge/:sessionId', challengeController.getChallengeSession);

// 5) Submit a challenge answer
//    POST /api/adaptive/challenge/:sessionId/submit
router.post('/challenge/:sessionId/submit', challengeSubmissionController.submitChallengeAnswer);

// 6) Retrieve a participant’s submission for a given challenge session
//    GET /api/adaptive/challenge/:sessionId/submission/:participant
router.get('/challenge/:sessionId/submission/:participant', challengeSubmissionController.getChallengeSubmission);

// 7) Finalize and retrieve challenge results
//    GET /api/adaptive/challenge/:sessionId/results
router.get('/challenge/:sessionId/results', challengeController.finalizeChallengeSession);

// Export our router
module.exports = router;
