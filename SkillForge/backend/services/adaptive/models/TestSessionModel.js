// File: SkillForge/backend/services/adaptive/models/TestSessionModel.js

const mongoose = require('mongoose');

const RoundQuestionSchema = new mongoose.Schema({
  question_id: Number,
  attempts: { type: Number, default: 0 },
  correct: { type: Boolean, default: false },
  done: { type: Boolean, default: false },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null }
}, { _id: false });

const RoundSchema = new mongoose.Schema({
  roundNumber: Number,
  questions: [RoundQuestionSchema],
  completed: { type: Boolean, default: false },
  startTime: { type: Date, default: null },
  timeLimit: { type: Number, default: 600 }  // seconds
}, { _id: false });

const TestSessionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },    // e.g. "UserTest123"
  attemptNumber: { type: Number, default: 1 },  // 1, 2, 3, etc.

  phase: { type: String, default: 'round1' },   // 'round1', 'round2', 'round3', 'finished'
  total_score: { type: Number, default: 0 },
  badge: { type: String, default: '' },

  // Mastery maps
  topic_mastery: {
    type: Map,
    of: Number,
    default: {
      'Recursion': 0.5,
      'File I/O': 0.5,
      'OOP': 0.5,
      'Loops': 0.5,
      'String Manipulation': 0.5
    }
  },
  difficulty_mastery: {
    type: Map,
    of: Number,
    default: {
      'easy': 0.5,
      'medium': 0.5,
      'hard': 0.5
    }
  },

  rounds: [RoundSchema],

  // We can store some timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Make sure updatedAt is always set
TestSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('TestSession', TestSessionSchema);
