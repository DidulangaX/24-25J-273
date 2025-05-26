const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../authMiddleware');

// Routes
router.post(
  '/questions',
  authMiddleware.authenticateToken,
  interviewController.addQuestion
); // Add a new question

router.get(
  '/questions/:id',
  authMiddleware.authenticateToken,
  interviewController.getQuestionById
); // Get question by ID

router.get(
  '/interview-questions',
  authMiddleware.authenticateToken,
  interviewController.getInterviewQuestions
); // Fetch 8 theory + 2 coding questions

router.post(
  '/submit-answer',
  authMiddleware.authenticateToken,
  interviewController.submitAnswer
); // Submit an answer

router.post(
  '/gemini-answer',
  authMiddleware.authenticateToken,
  interviewController.getGeminiAnswer
);


module.exports = router;
