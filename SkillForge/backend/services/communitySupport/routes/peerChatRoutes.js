const express = require('express');
const router = express.Router();
const peerChatController = require('../controllers/peerChatController');
const authMiddleware = require('../authMiddleware');

// --- Peer APIs ---
router.get('/peers', authMiddleware.authenticateToken, peerChatController.getPeers); // GET /api/community/peer-chat/peers - Get list of peers
router.post('/peer-requests/', authMiddleware.authenticateToken, peerChatController.requestPeerMatch); // POST /api/community/peer-chat/peer-requests/ - Request a peer match
router.get('/peer-requests/received', authMiddleware.authenticateToken, peerChatController.getReceivedPeerRequests); // GET /api/community/peer-requests/received - Get received peer requests
router.post('/peer-requests/:requestId/accept', authMiddleware.authenticateToken, peerChatController.acceptPeerRequest); // POST /api/community/peer-requests/:requestId/accept - Accept peer request
router.post('/peer-requests/:requestId/decline', authMiddleware.authenticateToken, peerChatController.declinePeerRequest); // POST /api/community/peer-requests/:requestId/decline - Decline peer request


// --- Chat Session APIs ---
router.get('/chat-sessions/:sessionId/messages', authMiddleware.authenticateToken, peerChatController.getChatMessages); // GET /api/community/chat-sessions/:sessionId/messages - Get chat messages
router.post('/chat-sessions/:sessionId/messages', authMiddleware.authenticateToken, peerChatController.postChatMessage); // POST /api/community/chat-sessions/:sessionId/messages - Send chat message
router.get('/chat-sessions/', authMiddleware.authenticateToken, peerChatController.getUserChatSessions); // GET /api/community/chat-sessions/ - Get user's chat sessions


module.exports = router;