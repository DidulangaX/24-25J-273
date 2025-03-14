const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../authMiddleware');

// Routes
router.post('/questions',authMiddleware.authenticateToken,interviewController.addQuestion); // Add a new question
router.get('/questions/:id',authMiddleware.authenticateToken,interviewController.getQuestionById);

module.exports = router;