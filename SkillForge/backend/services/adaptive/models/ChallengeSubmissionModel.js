// SkillForge/backend/services/adaptive/models/ChallengeSubmissionModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmissionSchema = new Schema({
  question_id: { type: Number, required: true },
  answer: { type: String, required: true },
  attempts: { type: Number, default: 1 },
  correct: { type: Boolean, default: false },
  timeTaken: { type: Number } // Time taken (in seconds) to answer
}, { _id: false });

const ChallengeSubmissionSchema = new Schema({
  challengeSession: { type: Schema.Types.ObjectId, ref: 'ChallengeSession', required: true },
  participant: { type: String, required: true },
  submissions: [SubmissionSchema],
  totalScore: { type: Number, default: 0 },
  finishedAt: { type: Date },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
});

module.exports = mongoose.model('ChallengeSubmission', ChallengeSubmissionSchema);
