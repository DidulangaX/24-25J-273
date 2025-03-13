const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true }, // Session to which this message belongs
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who sent the message
    content: { type: String, required: true }, // Message text content
    timestamp: { type: Date, default: Date.now }
});

// Set the custom collection name to "communitychatmessages"
module.exports = mongoose.model('ChatMessage', chatMessageSchema, 'communitychatmessages');