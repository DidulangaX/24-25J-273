const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { authenticateToken } = require('../authMiddleware');

router.post('/post', authenticateToken, communityController.createPost);
router.get('/posts', communityController.getAllPosts);
router.get('/post/:id', communityController.getPostById);
router.delete('/post/:id', authenticateToken, communityController.deletePost);

module.exports = router;
