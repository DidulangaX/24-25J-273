
const mongoose = require('mongoose');

const RoundQuestionSchema = new mongoose.Schema({
  question_id: Number,
  attempts: { type: Number, default: 0 },
  correct: { type: Boolean, default: false },
  done: { type: Boolean, default: false },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true }
}, { _id: false });

const RoundSchema = new mongoose.Schema({
  roundNumber: Number,
  questions: [RoundQuestionSchema],
  completed: { type: Boolean, default: false },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  timeLimit: { type: Number, default: 600 },  // seconds
  minPassingScore: { type: Number, default: 60 }, // minimum score needed to pass
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false }
}, { _id: false });

const RoundSummarySchema = new mongoose.Schema({
  roundNumber: Number,
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  timeSpent: Number, // in seconds
  topicPerformance: {
    type: Map,
    of: {
      correct: Number,
      total: Number,
      percentage: Number
    }
  },
  difficultyPerformance: {
    type: Map,
    of: {
      correct: Number,
      total: Number,
      percentage: Number
    }
  },
  passed: Boolean
}, { _id: false });

const TestSessionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  attemptNumber: { type: Number, default: 1 },
  
  // Track current state
  phase: { type: String, default: 'round1' }, // 'round1', 'round2', 'round3', 'finished'
  total_score: { type: Number, default: 0 },
  badge: { type: String, default: '' },
  
  // Round configuration
  roundSettings: {
    round1: {
      easyPercentage: { type: Number, default: 70 },
      mediumPercentage: { type: Number, default: 30 },
      hardPercentage: { type: Number, default: 0 },
      timeLimit: { type: Number, default: 900 }, // 15 minutes
      minPassingScore: { type: Number, default: 60 } // 60%
    },
    round2: {
      easyPercentage: { type: Number, default: 30 },
      mediumPercentage: { type: Number, default: 50 },
      hardPercentage: { type: Number, default: 20 },
      timeLimit: { type: Number, default: 720 }, // 12 minutes
      minPassingScore: { type: Number, default: 65 } // 65%
    },
    round3: {
      easyPercentage: { type: Number, default: 10 },
      mediumPercentage: { type: Number, default: 40 },
      hardPercentage: { type: Number, default: 50 },
      timeLimit: { type: Number, default: 600 }, // 10 minutes
      minPassingScore: { type: Number, default: 70 } // 70%
    }
  },

  // Mastery tracking
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

  // Rounds and summaries
  rounds: [RoundSchema],
  roundSummaries: [RoundSummarySchema],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Make sure updatedAt is always set
TestSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('TestSession', TestSessionSchema);