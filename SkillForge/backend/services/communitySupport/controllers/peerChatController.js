const PeerRequest = require('../models/peerRequest');
const ChatSession = require('../models/chatSession');
const ChatMessage = require('../models/chatMessage');
const axios = require('axios'); // Import axios for making HTTP requests

// **IMPORTANT:** Configure the base URL of your authenticate service here
const authenticateServiceBaseUrl = 'http://localhost:5000/api/auth'; // **Replace with your actual auth service URL**


// --- Peer List API ---
const getPeers = async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        // --- API Call to authenticate service to get users ---
        try {
            const response = await axios.get(`${authenticateServiceBaseUrl}/users`, {
                headers: {
                    Authorization: req.header('Authorization') // Forward the JWT token for authentication in auth service
                }
            });
            const allUsers = response.data; // Assuming authenticate service returns an array of user objects

            // Filter out the current user to get peers
            const peers = allUsers.filter(user => user._id !== currentUserId);
            // Select only necessary fields (username, role) - adjust based on actual API response
            const selectedPeersInfo = peers.map(user => ({
                userId: user._id,
                username: user.username,
                role: user.role
            }));

            res.json(selectedPeersInfo); // Respond with the filtered peer list

        } catch (apiError) {
            console.error("Error fetching users from authenticate service:", apiError.message);
            return res.status(500).json({ message: 'Error fetching peers from authentication service', error: apiError.message });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error fetching peers', error: error.message });
    }
};

// --- Request Peer Match API ---
const requestPeerMatch = async (req, res) => {
    try {
        const requesterUserId = req.user.userId;
        const requestedUserId = req.body.peerUserId;

        if (!requestedUserId) {
            return res.status(400).json({ message: 'Peer user ID is required' });
        }
        if (requesterUserId === requestedUserId) {
            return res.status(400).json({ message: 'Cannot request peer match with yourself' });
        }

        // Check if a pending request already exists from this user to the requested peer
        const existingRequest = await PeerRequest.findOne({
            requesterUserId: requesterUserId,
            requestedUserId: requestedUserId,
            status: 'pending'
        });
        if (existingRequest) {
            return res.status(409).json({ message: 'Pending peer request already exists for this user' }); // 409 Conflict
        }

        const newRequest = new PeerRequest({
            requesterUserId,
            requestedUserId
        });
        const savedRequest = await newRequest.save();
        res.status(201).json({ message: 'Peer match request sent successfully', requestId: savedRequest._id });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        res.status(500).json({ message: 'Error requesting peer match', error: error.message });
    }
};


// --- Get Received Peer Requests API ---
const getReceivedPeerRequests = async (req, res) => {
    try {
        const requestedUserId = req.user.userId;
        const pendingRequests = await PeerRequest.find({
            requestedUserId: requestedUserId,
            status: 'pending'
        })
        .populate('requesterUserId', 'username'); // Populate requester's username

        const formattedRequests = pendingRequests.map(request => ({
            requestId: request._id,
            requesterUser: {
                userId: request.requesterUserId._id,
                username: request.requesterUserId.username
            },
            requestedAt: request.createdAt
        }));

        res.json(formattedRequests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching received peer requests', error: error.message });
    }
};


// --- Accept Peer Request API ---
const acceptPeerRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const requestedUser接收者Id = req.user.userId; // User accepting the request

        const peerRequest = await PeerRequest.findById(requestId).populate('requesterUserId');
        if (!peerRequest) {
            return res.status(404).json({ message: 'Peer request not found' });
        }

        if (peerRequest.requestedUserId.toString() !== requestedUser接收者Id) {
            return res.status(403).json({ message: 'Unauthorized to accept this request' }); // 403 Forbidden
        }
        if (peerRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request is not pending' }); // 400 Bad Request if already accepted/declined
        }

        // Create a new chat session
        const newChatSession = new ChatSession({
            participants: [peerRequest.requesterUserId, peerRequest.requestedUserId] // Add both users as participants
        });
        const savedChatSession = await newChatSession.save();

        // Update PeerRequest status to 'accepted'
        peerRequest.status = 'accepted';
        await peerRequest.save();

        res.json({ message: 'Peer match request accepted, chat session started', chatSessionId: savedChatSession._id });

    } catch (error) {
        res.status(500).json({ message: 'Error accepting peer request', error: error.message });
    }
};


// --- Decline Peer Request API ---
const declinePeerRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const requestedUserId = req.user.userId; // User declining the request

        const peerRequest = await PeerRequest.findById(requestId);
        if (!peerRequest) {
            return res.status(404).json({ message: 'Peer request not found' });
        }
        if (peerRequest.requestedUserId.toString() !== requestedUserId) {
            return res.status(403).json({ message: 'Unauthorized to decline this request' }); // 403 Forbidden
        }
        if (peerRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request is not pending' }); // 400 Bad Request if already accepted/declined
        }

        peerRequest.status = 'declined';
        await peerRequest.save();

        res.json({ message: 'Peer match request declined' });

    } catch (error) {
        res.status(500).json({ message: 'Error declining peer request', error: error.message });
    }
};


// --- Get Chat Messages API ---
const getChatMessages = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const currentUserId = req.user.userId;

        const chatSession = await ChatSession.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }

        // Check if the current user is a participant in the chat session
        if (!chatSession.participants.map(id => id.toString()).includes(currentUserId)) {
            return res.status(403).json({ message: 'Not a participant in this chat session' }); // 403 Forbidden
        }

        const messages = await ChatMessage.find({ sessionId: sessionId })
            .populate('senderUserId', 'username'); // Populate sender's username

        const formattedMessages = messages.map(message => ({
            messageId: message._id,
            senderUser: {
                userId: message.senderUserId._id,
                username: message.senderUserId.username
            },
            content: message.content,
            timestamp: message.timestamp
        }));

        res.json(formattedMessages);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat messages', error: error.message });
    }
};


// --- Send Chat Message API ---
const postChatMessage = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const senderUserId = req.user.userId;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const chatSession = await ChatSession.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        if (!chatSession.participants.map(id => id.toString()).includes(senderUserId)) {
            return res.status(403).json({ message: 'Not a participant in this chat session' }); // 403 Forbidden
        }

        const newMessage = new ChatMessage({
            sessionId,
            senderUserId,
            content
        });
        const savedMessage = await newMessage.save();
        res.status(201).json({ message: 'Message sent', messageId: savedMessage._id });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        res.status(500).json({ message: 'Error sending chat message', error: error.message });
    }
};


// --- Get Chat Sessions for User API ---
const getUserChatSessions = async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        const chatSessions = await ChatSession.find({ participants: currentUserId })
            .populate('participants', 'username'); // Populate participants' usernames

        const formattedSessions = chatSessions.map(session => {
            // Determine the peer user (the other participant, not the current user)
            const peerUser = session.participants.find(participant => participant._id.toString() !== currentUserId);
            return {
                sessionId: session._id,
                peerUser: peerUser ? { userId: peerUser._id, username: peerUser.username } : null, // Provide peer user info
                lastMessageTimestamp: session.updatedAt // Or find the last message's timestamp if you track that separately
            };
        });

        res.json(formattedSessions);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching user chat sessions', error: error.message });
    }
};


module.exports = {
    getPeers,
    requestPeerMatch,
    getReceivedPeerRequests,
    acceptPeerRequest,
    declinePeerRequest,
    getChatMessages,
    postChatMessage,
    getUserChatSessions
};