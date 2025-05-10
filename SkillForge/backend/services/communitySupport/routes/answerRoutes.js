
const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const authMiddleware = require('../authMiddleware');

// Route to create a new answer (protected - user must be logged in)
router.post('/', authMiddleware.authenticateToken, answerController.postAnswer); // POST /api/community/answers/ - Create an answer
//router.get('/:questionId/answers', answerController.getAnswersByQuestionId);
router.put('/:id', authMiddleware.authenticateToken, answerController.updateAnswer); // PUT /api/community/answers/:id - Update an answer
router.delete('/:id', authMiddleware.authenticateToken, answerController.deleteAnswer); // DELETE /api/community/answers/:id - Delete an answer
router.post('/:id/like', authMiddleware.authenticateToken, answerController.likeAnswer);
router.post('/:id/upvote', authMiddleware.authenticateToken, answerController.upvoteAnswer); 
router.post('/:id/downvote', authMiddleware.authenticateToken, answerController.downvoteAnswer);

module.exports = router;