//SkillForge\backend\services\adaptive\models\QuestionModel.js
const mongoose = require('mongoose');

// Basic schema for a question, with a topic and difficulty.
const QuestionSchema = new mongoose.Schema({
  question_id: {
    type: Number,
    required: true,
    unique: true
  },
  prompt: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
    enum: [
      'Recursion',
      'File I/O',
      'OOP',
      'Loops',
      'String Manipulation'
    ]
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  }
});

module.exports = mongoose.model('AdaptiveQuestion', QuestionSchema);
