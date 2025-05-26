// SKILLFORGE/backend/services/interviewPreparation/controllers/interviewController.js
require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');
const InterviewQuestion = require('../models/InterviewQuestion');
const axios = require('axios');
const { theory } = require('./theory'); // Corrected import
const FLASH_ENDPOINT = process.env.GEMINI_FLASH_ENDPOINT;
const FLASH_KEY      = process.env.GEMINI_API_KEY;


// Submit answer (theory via ChatGPT + local model; coding via local model)
const submitAnswer = async (req, res) => {
  try {
    const { question, answer, questionType } = req.body;
    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    let gptFeedback = null;
    // For theory questions, call ChatGPT first
    if (questionType === 'theory') {
      gptFeedback = theory(question, answer);
    }

    // Determine local scoring script
    const scriptFile = questionType === 'coding'
      ? 'logicalErrorModel.py'
      : 'theoryAnswerChecker.py';
    console.log(`Using local model script: ${scriptFile}`);
    const scriptPath = path.join(__dirname, '../models', scriptFile);

    const args = questionType === 'coding'
      ? [scriptPath, answer]
      : [scriptPath, question, answer];

    const pythonProcess = spawn('python', args);
    console.log(`Running local model with args: ${args.join(' ')}`);
    let stdout = '', stderr = '';
    pythonProcess.stdout.on('data', data => { stdout += data.toString(); });
    pythonProcess.stderr.on('data', data => { stderr += data.toString(); });

    pythonProcess.on('close', () => {
      if (stderr) {
        console.error('Local model error:', stderr);
        return res.status(500).json({ message: 'Local model error', error: stderr });
      }
      let modelFeedback;
      try {
        modelFeedback = JSON.parse(stdout);
      } catch (parseErr) {
        console.error('Local JSON parse error:', parseErr, stdout);
        return res.status(500).json({ message: 'Invalid local model output', raw: stdout });
      }

      // Return GPT feedback as primary, include local as secondary
      return res.status(200).json({
        gptFeedback,
        modelFeedback
      });
    });
  } catch (err) {
    console.error('submitAnswer error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Add a new question
const addQuestion = async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;
    const newQuestion = new InterviewQuestion({ question, category, questionType: 'theory', difficulty });
    await newQuestion.save();
    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get question by ID
const getQuestionById = async (req, res) => {
  try {
    const q = await InterviewQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.status(200).json(q);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Fetch 8 theory and 2 coding questions
async function getInterviewQuestions(req, res) {
  try {
    // sample 3 Easy theory
    const easy = await InterviewQuestion.aggregate([
      { $match: { questionType: 'theory', difficulty: 'Easy' } },
      { $sample: { size: 3 } }
    ]);

    // sample 3 Medium theory
    const medium = await InterviewQuestion.aggregate([
      { $match: { questionType: 'theory', difficulty: 'Medium' } },
      { $sample: { size: 3 } }
    ]);

    // sample 2 Hard theory
    const hard = await InterviewQuestion.aggregate([
      { $match: { questionType: 'theory', difficulty: 'Hard' } },
      { $sample: { size: 2 } }
    ]);

    // sample 2 coding
    const coding = await InterviewQuestion.aggregate([
      { $match: { questionType: 'coding' } },
      { $sample: { size: 2 } }
    ]);

    // Combine in the requested order
    const questions = [...easy, ...medium, ...hard, ...coding];

    return res.status(200).json({ questions });
  } catch (err) {
    console.error('getInterviewQuestions error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function getGeminiAnswer(req, res) {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Updated request structure for Gemini API
    const response = await axios.post(
      `${FLASH_ENDPOINT}?key=${FLASH_KEY}`,
      {
        contents: [{
          parts: [{
            text: question
          }]
        }],
        generationConfig: {  // Correct parameter namespace
          temperature: 0.2,  // Now under generationConfig
          maxOutputTokens: 256,  // camelCase instead of snake_case
          candidateCount: 1  // camelCase instead of snake_case
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Updated response parsing
    const candidates = response.data?.candidates;
    if (!candidates?.length) {
      return res.status(502).json({ message: 'No answer from Gemini-Flash' });
    }

    // Accessing the correct response structure
    const answer = candidates[0].content?.parts[0]?.text?.trim() || '';
    return answer 
      ? res.json({ answer })
      : res.status(502).json({ message: 'Empty response from Gemini-Flash' });
  } catch (err) {
    console.error('Gemini-Flash API error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Gemini-Flash service error' });
  }
}

module.exports = { submitAnswer, addQuestion, getQuestionById, getInterviewQuestions, getGeminiAnswer };
