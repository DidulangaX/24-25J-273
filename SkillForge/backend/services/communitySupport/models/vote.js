// SkillForge\backend\services\communitySupport\models\vote.js
const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who voted
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }, // Question voted on
    voteType: { type: String, enum: ['upvote', 'downvote'], required: true }, // Type of vote (upvote or downvote)
    createdAt: { type: Date, default: Date.now }
});

// To prevent duplicate votes by the same user on the same question, create a unique index
voteSchema.index({ userId: 1, questionId: 1, voteType: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema, 'communityquestionvotes'); // Custom collection name

module.exports = Vote;