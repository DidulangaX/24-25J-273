const Interview = require('../models/Interview');

const createInterview = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const newInterview = new Interview({
      userId: req.user.userId, 
      topic,
      difficulty
    });

    await newInterview.save();
    res.status(201).json({ message: 'Interview session created', newInterview });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getUserInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.userId });
    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { createInterview, getUserInterviews };

