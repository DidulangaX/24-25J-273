const Question = require('../models/question');

const postQuestion = async (req, res) => {
    try {
        const { title, content, tags, peerMatchRequested } = req.body;
        const userId = req.user.userId; // User from authentication middleware

        const newQuestion = new Question({
            userId,
            title,
            content,
            tags,
            peerMatchRequested
        });

        const savedQuestion = await newQuestion.save();
        res.status(201).json(savedQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Error posting question', error: error.message });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get page from query params, default to 1
        const limit = parseInt(req.query.limit) || 10; // Get limit from query params, default to 10
        const skip = (page - 1) * limit;

        const questions = await Question.find({})
            .populate('userId', 'username email')
            .skip(skip) // Apply skip for pagination
            .limit(limit); // Apply limit for pagination

        const totalQuestions = await Question.countDocuments(); // Get total number of questions
        const totalPages = Math.ceil(totalQuestions / limit);

        res.json({
            questions,
            page,
            totalPages,
            totalQuestions
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id).populate('userId', 'username email');
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching question', error: error.message });
    }
};

const likeQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const userId = req.user.userId;
        if (question.likes.includes(userId)) {
            // Unlike if already liked
            question.likes = question.likes.filter(id => id.toString() !== userId);
        } else {
            // Like if not liked
            question.likes.push(userId);
        }
        await question.save();
        res.json({ message: 'Question like status updated', likes: question.likes.length });
    } catch (error) {
        res.status(500).json({ message: 'Error liking question', error: error.message });
    }
};

module.exports = { postQuestion, getAllQuestions, getQuestionById, likeQuestion };