// SkillForge\backend\services\communitySupport\controllers\answerController.js
const Answer = require('../models/answer');
const Question = require('../models/question'); // To update question answer count (optional)

const postAnswer = async (req, res) => {
    try {
        const { questionId, content } = req.body;
        const userId = req.user.userId;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const newAnswer = new Answer({
            questionId,
            userId,
            content,
        });

        const savedAnswer = await newAnswer.save();
        res.status(201).json(savedAnswer);

    } catch (error) {
        res.status(500).json({ message: 'Error posting answer', error: error.message });
    }
};

const getAnswersByQuestionId = async (req, res) => {
    try {
        const answers = await Answer.find({ questionId: req.params.questionId })
            .populate('userId', 'username email');  // You can also populate any other fields if needed
        res.json(answers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching answers', error: error.message });
    }
};


const likeAnswer = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        const userId = req.user.userId;
        if (answer.likes.includes(userId)) {
            answer.likes = answer.likes.filter(id => id.toString() !== userId);
        } else {
            answer.likes.push(userId);
        }
        await answer.save();
        res.json({ message: 'Answer like status updated', likes: answer.likes.length });
    } catch (error) {
        res.status(500).json({ message: 'Error liking answer', error: error.message });
    }
};

const upvoteAnswer = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        const userId = req.user.userId;

        // Check if user already downvoted, remove downvote if present
        answer.downvotes = answer.downvotes.filter(id => id.toString() !== userId);

        if (answer.upvotes.includes(userId)) {
            // If already upvoted, remove upvote (撤销赞成)
            answer.upvotes = answer.upvotes.filter(id => id.toString() !== userId);
        } else {
            // Otherwise, add upvote (赞成)
            answer.upvotes.push(userId);
        }

        await answer.save();
        res.json({ message: 'Answer upvote status updated', upvotes: answer.upvotes.length, downvotes: answer.downvotes.length });

    } catch (error) {
        res.status(500).json({ message: 'Error upvoting answer', error: error.message });
    }
};

const downvoteAnswer = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        const userId = req.user.userId;

        // Check if user already upvoted, remove upvote if present
        answer.upvotes = answer.upvotes.filter(id => id.toString() !== userId);

        if (answer.downvotes.includes(userId)) {
            // If already downvoted, remove downvote (撤销反对)
            answer.downvotes = answer.downvotes.filter(id => id.toString() !== userId);
        } else {
            // Otherwise, add downvote (反对)
            answer.downvotes.push(userId);
        }

        await answer.save();
        res.json({ message: 'Answer downvote status updated', upvotes: answer.upvotes.length, downvotes: answer.downvotes.length });

    } catch (error) {
        res.status(500).json({ message: 'Error downvoting answer', error: error.message });
    }
};

const updateAnswer = async (req, res) => {
    try {
        const { content } = req.body;
        const answerId = req.params.id;

        const updatedAnswer = await Answer.findByIdAndUpdate(
            answerId,
            { content, updatedAt: Date.now() },
            { new: true } // Return the updated document
        );

        if (!updatedAnswer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        res.json(updatedAnswer);

    } catch (error) {
        res.status(500).json({ message: 'Error updating answer', error: error.message });
    }
};

const deleteAnswer = async (req, res) => {
    try {
        const answerId = req.params.id;
        const deletedAnswer = await Answer.findByIdAndDelete(answerId);

        if (!deletedAnswer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        res.json({ message: 'Answer deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting answer', error: error.message });
    }
};

module.exports = {
    postAnswer,
    getAnswersByQuestionId,
    likeAnswer,
    updateAnswer,
    deleteAnswer,
    upvoteAnswer, 
    downvoteAnswer
};