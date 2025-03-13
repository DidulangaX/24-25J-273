const mongoose = require('mongoose');

const peerRequestSchema = new mongoose.Schema({
    requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who initiated the request
    requestedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who is being requested as a peer
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'cancelled'], // Possible request statuses
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Set the custom collection name to "communitypeerre запросы" (using запросы for 'requests' in Russian, you can change this)
module.exports = mongoose.model('PeerRequest', peerRequestSchema, 'communitypeerreRequests');