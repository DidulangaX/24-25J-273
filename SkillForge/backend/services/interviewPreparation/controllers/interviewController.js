// SKILLFORGE\backend\services\interviewPreparation\controllers\interviewController.js
const InterviewQuestion = require('../models/InterviewQuestion');

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


// Fetch 10 random questions for an interview session
const getInterviewQuestions = async (req, res) => {
  try {
    const questions = await InterviewQuestion.aggregate([{ $sample: { size: 10 } }]);
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

module.exports = { addQuestion, getQuestionById, getInterviewQuestions, getQuestionByIndex };