const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../authMiddleware');

router.post('/', authMiddleware.authenticateToken, interviewController.createInterview);
router.get('/', authMiddleware.authenticateToken, interviewController.getUserInterviews);

module.exports = router;
