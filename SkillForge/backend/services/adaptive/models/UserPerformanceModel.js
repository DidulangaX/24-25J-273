// File: SkillForge/backend/services/adaptive/models/UserPerformanceModel.js

const mongoose = require('mongoose');

const RoundQuestionSchema = new mongoose.Schema({
  question_id: Number,
  attempts: { type: Number, default: 0 },
  correct: { type: Boolean, default: false },
  done: { type: Boolean, default: false },
  startTime: { type: Date, default: null },  // <--- ADDED
  endTime: { type: Date, default: null }      // <--- ADDED
}, { _id: false });

const RoundSchema = new mongoose.Schema({
  roundNumber: Number,
  questions: [RoundQuestionSchema],
  completed: { type: Boolean, default: false },
  startTime: { type: Date },
  timeLimit: { type: Number, default: 600 } // seconds or so
}, { _id: false });

const UserPerformanceSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  total_score: { type: Number, default: 0 },
  topic_mastery: {
    type: Map,
    of: Number,
    default: {
      'Basic Syntax': 0.5,
      'File I/O': 0.5,
      'OOP': 0.5,
      'Data Structures': 0.5,
      'Algorithms': 0.5,
      'Exceptions': 0.5,
      'Generics': 0.5,
      'Streams': 0.5,
      'Multithreading': 0.5,
      'Design Patterns': 0.5
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
  rounds: {
    type: [RoundSchema],
    default: []
  },
  phase: { type: String, default: 'round1' },

  badge: { type: String, default: '' }
});

module.exports = mongoose.model('AdaptiveUserPerformance', UserPerformanceSchema);
