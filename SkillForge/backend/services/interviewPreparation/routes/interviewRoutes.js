const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../../authenticate/authMiddleware');

router.post('/questions', authMiddleware.authenticateToken, interviewController.addQuestion);
router.get('/questions', authMiddleware.authenticateToken, interviewController.getQuestions);
router.delete('/questions/:id', authMiddleware.authenticateToken, interviewController.deleteQuestion);

module.exports = router;
