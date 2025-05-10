const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs participating in the chat
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // You might want to add fields for session metadata here in the future, like a session topic or name.
});

// Set the custom collection name to "communitychatsessions"
module.exports = mongoose.model('ChatSession', chatSessionSchema, 'communitychatsessions');