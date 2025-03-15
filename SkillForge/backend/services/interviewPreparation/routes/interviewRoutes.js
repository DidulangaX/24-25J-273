const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../authMiddleware');

// Routes
router.post('/questions',authMiddleware.authenticateToken,interviewController.addQuestion); // Add a new question
router.get('/questions/:id',authMiddleware.authenticateToken,interviewController.getQuestionById);
router.get('/interview-questions', authMiddleware.authenticateToken, interviewController.getInterviewQuestions); // Get 10 random questions for the interview
router.get('/session/questions', authMiddleware.authenticateToken, interviewController.getInterviewQuestions);
router.get('/session/:sessionId/question/:index', authMiddleware.authenticateToken, interviewController.getQuestionByIndex);


module.exports = router;