// controllers/questionController.js

const axios = require('axios');
const Question = require('../models/question');
const Answer   = require('../models/answer');
const Vote     = require('../models/vote');

// Create a new question, automatically classified by urgency
const postQuestion = async (req, res) => {
    try {
        const { title, content, tags, peerMatchRequested } = req.body;
        const userId = req.user.userId;

        // 1️⃣ Combine title + content for the model
        const textForModel = `${title}. ${content}`;

        // 2️⃣ Call the Python predict API
        const response = await axios.post(
            'http://localhost:5005/predict',
            { text: textForModel }
        );
        const urgencyLabel = response.data.label;

        // 3️⃣ Save question with predicted urgency
        const newQuestion = new Question({
            userId,
            title,
            content,
            tags,
            peerMatchRequested,
            urgency: urgencyLabel
        });

        const savedQuestion = await newQuestion.save();
        res.status(201).json(savedQuestion);
    } catch (error) {
        console.error('Error posting question:', error);
        res.status(500).json({
            message: 'Error posting question',
            error: error.message
        });
    }
};


// List all High-urgency questions, sorted newest first
const getUrgentQuestions = async (req, res) => {
  try {
    const urgent = await Question
      .find({ urgency: 'High' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ questions: urgent });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching urgent questions', error: err.message });
  }
};

// Return only the count of High-urgency questions
const getUrgentCount = async (req, res) => {
  try {
    const count = await Question.countDocuments({ urgency: 'High' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching urgent count', error: err.message });
  }
};



const getAllQuestions = async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip  = (page - 1) * limit;

        const questions = await Question.find({})
            .populate({ path: 'userId', select: 'username profilePic' })
            .skip(skip)
            .limit(limit)
            .lean()
            .sort({ createdAt: -1 });

        const totalQuestions = await Question.countDocuments();
        const totalPages     = Math.ceil(totalQuestions / limit);

        const questionList = await Promise.all(questions.map(async (q) => {
            const upvotes    = await Vote.countDocuments({ questionId: q._id, voteType: 'upvote' });
            const downvotes  = await Vote.countDocuments({ questionId: q._id, voteType: 'downvote' });
            const answerCount= await Answer.countDocuments({ questionId: q._id });

            return {
                _id:             q._id,
                title:           q.title,
                content:         q.content,
                tags:            q.tags,
                urgency:         q.urgency,
                createdAt:       q.createdAt,
                authorName:      q.userId?.username || 'Anonymous',
                authorProfilePic:q.userId?.profilePic || null,
                upvotes,
                downvotes,
                answerCount
            };
        }));

        res.json({ questions: questionList, page, totalPages, totalQuestions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question
            .findById(req.params.id)
            .populate('userId', 'username email');
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        console.error('Error fetching question by ID:', error);
        res.status(500).json({ message: 'Error fetching question', error: error.message });
    }
};

const upvoteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const userId = req.user.userId;
        question.downvotes = question.downvotes.filter(id => id.toString() !== userId);
        if (question.upvotes.includes(userId)) {
            question.upvotes = question.upvotes.filter(id => id.toString() !== userId);
        } else {
            question.upvotes.push(userId);
        }
        await question.save();
        res.json({
            message: 'Question upvote status updated',
            upvotes: question.upvotes.length,
            downvotes: question.downvotes.length
        });
    } catch (error) {
        console.error('Error upvoting question:', error);
        res.status(500).json({ message: 'Error upvoting question', error: error.message });
    }
};

const downvoteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const userId = req.user.userId;
        question.upvotes = question.upvotes.filter(id => id.toString() !== userId);
        if (question.downvotes.includes(userId)) {
            question.downvotes = question.downvotes.filter(id => id.toString() !== userId);
        } else {
            question.downvotes.push(userId);
        }
        await question.save();
        res.json({
            message: 'Question downvote status updated',
            upvotes: question.upvotes.length,
            downvotes: question.downvotes.length
        });
    } catch (error) {
        console.error('Error downvoting question:', error);
        res.status(500).json({ message: 'Error downvoting question', error: error.message });
    }
};

module.exports = {
    postQuestion,
    getAllQuestions,
    getQuestionById,
    upvoteQuestion,
    downvoteQuestion,
    getUrgentQuestions,
    getUrgentCount
};

