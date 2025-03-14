const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');

// Route to get answers for a specific question
router.get('/:questionId/answers', answerController.getAnswersByQuestionId); // GET /api/community/questions/:questionId/answers

module.exports = router;