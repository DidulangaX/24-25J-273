const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const authMiddleware = require('../authMiddleware');

// Question Routes - Base path for these routes will be /api/community/questions

router.post("/", authMiddleware.authenticateToken, questionController.postQuestion); // POST /api/community/questions/ - Create a question
router.get("/", questionController.getAllQuestions);           // GET  /api/community/questions/ - Get all questions
router.get("/:id", questionController.getQuestionById);        // GET  /api/community/questions/:id - Get question by ID
//router.post("/:id/like", authMiddleware.authenticateToken, questionController.likeQuestion); // POST /api/community/questions/:id/like - Like a question
router.post("/:id/upvote", authMiddleware.authenticateToken, questionController.upvoteQuestion);
router.post("/:id/downvote", authMiddleware.authenticateToken, questionController.downvoteQuestion);


// GET /api/community/questions/urgent  → list only High-urgency
router.get('/urgent', questionController.getUrgentQuestions);

// GET /api/community/questions/urgent/count  → just return { count: N }
router.get('/urgent/count', questionController.getUrgentCount);
module.exports = router;