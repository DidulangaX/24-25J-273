const Question = require('../models/question');
const Answer = require('../models/answer'); // Make sure you have this if not already present
const Vote = require('../models/vote');     // Make sure you have this if not already present

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const questions = await Question.find({})
            .populate({
                path: 'userId',
                select: 'username profilePic'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .sort({ createdAt: -1 });

        const totalQuestions = await Question.countDocuments();
        const totalPages = Math.ceil(totalQuestions / limit);

        const questionList = await Promise.all(questions.map(async (question) => {
            const upvotes = await Vote.countDocuments({ questionId: question._id, voteType: 'upvote' });
            const downvotes = await Vote.countDocuments({ questionId: question._id, voteType: 'downvote' });
            const answerCount = await Answer.countDocuments({ questionId: question._id });

            return {
                _id: question._id,
                title: question.title,
                content: question.content,
                tags: question.tags,
                createdAt: question.createdAt,
                authorName: question.userId ? question.userId.username : 'Anonymous',
                authorProfilePic: question.userId ? question.userId.profilePic : null,
                upvotes: upvotes,
                downvotes: downvotes,
                answerCount: answerCount,
            };
        }));

        res.json({
            questions: questionList,
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



// ADD these upvoteQuestion and downvoteQuestion functions:
const upvoteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const userId = req.user.userId;

        // Check if user already downvoted, remove downvote if present
        question.downvotes = question.downvotes.filter(id => id.toString() !== userId);

        if (question.upvotes.includes(userId)) {
            // If already upvoted, remove upvote (toggle)
            question.upvotes = question.upvotes.filter(id => id.toString() !== userId);
        } else {
            // Otherwise, add upvote
            question.upvotes.push(userId);
        }

        await question.save();
        res.json({ message: 'Question upvote status updated', upvotes: question.upvotes.length, downvotes: question.downvotes.length });

    } catch (error) {
        res.status(500).json({ message: 'Error upvoting question', error: error.message });
    }
};

const downvoteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const userId = req.user.userId;

        // Check if user already upvoted, remove upvote if present
        question.upvotes = question.upvotes.filter(id => id.toString() !== userId);

        if (question.downvotes.includes(userId)) {
            // If already downvoted, remove downvote (toggle)
            question.downvotes = question.downvotes.filter(id => id.toString() !== userId);
        } else {
            // Otherwise, add downvote
            question.downvotes.push(userId);
        }

        await question.save();
        res.json({ message: 'Question downvote status updated', upvotes: question.upvotes.length, downvotes: question.downvotes.length });

    } catch (error) {
        res.status(500).json({ message: 'Error downvoting question', error: error.message });
    }
};


module.exports = {
    postQuestion,
    getAllQuestions,
    getQuestionById,
    // REMOVE this line: likeQuestion,  // No longer exporting likeQuestion
    upvoteQuestion,         // ADD upvoteQuestion
    downvoteQuestion        // ADD downvoteQuestion
};