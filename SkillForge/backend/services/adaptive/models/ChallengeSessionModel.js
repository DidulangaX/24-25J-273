//SkillForge\backend\services\adaptive\models\ChallengeSessionModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChallengeParticipantSchema = new Schema({
  user: { type: String, required: true },
  accepted: { type: Boolean, default: false }
}, { _id: false });

const ChallengeQuestionSchema = new Schema({
  question_id: { type: Number, required: true },
  attempts: { type: Number, default: 0 },
  prompt: { type: String, required: true },
  correct: { type: Boolean, default: false },
  answer: { type: String, default: '' }
}, { _id: false });

const ChallengeSessionSchema = new Schema({
  creator: { type: String, required: true },
  
  participants: [ChallengeParticipantSchema], 
  // e.g. [ { user: 'user999', accepted: false }, ... ]

  questions: [ChallengeQuestionSchema],
  startTime: { type: Date },
  endTime: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },

  result: {
    winner: { type: String },  // or ObjectId
    details: { type: Object }
  },

  // Time limit in seconds for the entire challenge, once active
  timeLimit: { type: Number, default: 300 } // 5 minutes, for example
});

module.exports = mongoose.model('ChallengeSession', ChallengeSessionSchema);
