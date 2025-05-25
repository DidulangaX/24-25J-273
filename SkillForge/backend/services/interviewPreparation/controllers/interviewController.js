// SKILLFORGE\backend\services\interviewPreparation\controllers\interviewController.js
const InterviewQuestion = require('../models/InterviewQuestion');
const axios = require("axios");
const path = require('path');
const { spawn } = require('child_process');

const submitAnswer = async (req, res) => {
  try {
    const { answer, questionType, question } = req.body;
    if (!answer || answer.trim() === '') {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    // Determine script
    const scriptFile = questionType === 'coding'
      ? 'logicalErrorModel.py'
      : 'theoryAnswerChecker.py';
    const scriptPath = path.join(__dirname, '../models', scriptFile);

    // Build args array
    const args = questionType === 'coding'
      ? [scriptPath, answer]
      : [scriptPath, question, answer];

    // Spawn Python process
    const pythonProcess = spawn('python', args);
    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', () => {
      if (stderr) {
        console.error('Python script error:', stderr);
        return res.status(500).json({ message: 'AI model error', error: stderr });
      }
      try {
        const feedback = JSON.parse(stdout);
        return res.status(200).json({ feedback });
      } catch (err) {
        console.error('Parse error:', err);
        return res.status(500).json({ message: 'Invalid model output', raw: stdout });
      }
    });

  } catch (err) {
    console.error('SubmitAnswer error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { submitAnswer };

// Add a new question (manual entry)
const addQuestion = async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;
    const newQuestion = new InterviewQuestion({ question, answer, category, difficulty });
    await newQuestion.save();
    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.log(error);
  }
};

// Get a question by ID
const getQuestionById = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Fetch 8 theory and 2 coding questions for an interview session
const getInterviewQuestions = async (req, res) => {
  try {
    // Fetch 8 theory questions
    const theoryQuestions = await InterviewQuestion.find({ questionType: 'theory' }).limit(8);
    
    // Fetch 2 coding questions
    const codingQuestions = await InterviewQuestion.find({ questionType: 'coding' }).limit(2);
    
    // Combine the questions
    const questions = [...theoryQuestions, ...codingQuestions];

    // Return the questions
    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.error(error);
  }
};


// Fetch a single question by index
const getQuestionByIndex = async (req, res) => {
  try {
    const { sessionId, index } = req.params;
    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (index < 0 || index >= session.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    res.status(200).json({ question: session.questions[index] });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.error(error);
  }
};

module.exports = { addQuestion, getQuestionById, getInterviewQuestions, getQuestionByIndex,submitAnswer };