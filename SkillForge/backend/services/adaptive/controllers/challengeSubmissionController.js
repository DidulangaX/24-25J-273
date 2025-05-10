// SkillForge/backend/services/adaptive/controllers/challengeSubmissionController.js
const ChallengeSubmission = require('../models/ChallengeSubmissionModel');
const ChallengeSession = require('../models/ChallengeSessionModel');
const AdaptiveQuestion = require('../models/QuestionModel');
const axios = require('axios');

exports.submitChallengeAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participant, question_id, answer, timeTaken } = req.body;

    if (!participant || !question_id || !answer) {
      return res.status(400).json({ error: 'participant, question_id, and answer are required' });
    }

    // Check if challenge session exists
    const session = await ChallengeSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Challenge session not found' });
    }

    // Find the question document
    const questionDoc = await AdaptiveQuestion.findOne({ question_id });
    if (!questionDoc) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Call the Python ML microservice to classify the answer
    const mlData = {
      instruction: questionDoc.prompt,
      input_text: '',
      user_answer: answer
    };
    const mlResponse = await axios.post('http://localhost:5001/classify', mlData);
    const classification = mlResponse.data.label; // "correct", "Incomplete Answer", "Syntax Error"
    const isCorrect = (classification === 'correct');

    // Points system: 10 points for first attempt, 5 for second, 2 for third
    let pointsAwarded = 0;

    // Find an existing submission document for this participant and session
    let submission = await ChallengeSubmission.findOne({ challengeSession: sessionId, participant });
    if (!submission) {
      submission = new ChallengeSubmission({ challengeSession: sessionId, participant, submissions: [] });
    }

    // Check if there's already a submission for this question
    let subEntry = submission.submissions.find(s => s.question_id === question_id);
    if (subEntry) {
      // If already reached 2 attempts, disallow further submissions
      if (subEntry.attempts >= 2) {
        return res.status(400).json({ error: 'Maximum attempts reached for this question' });
      }
      subEntry.attempts += 1;
      subEntry.answer = answer; // update with the new answer
      subEntry.timeTaken = timeTaken;
      if (isCorrect) {
        subEntry.correct = true;
        if (subEntry.attempts === 1) {
          pointsAwarded = 10;
        } else if (subEntry.attempts === 2) {
          pointsAwarded = 5;
        }
      }
    } else {
      // No submission yet for this question; create new
      const newSub = {
        question_id,
        answer,
        attempts: 1,
        correct: isCorrect,
        timeTaken
      };
      if (isCorrect) {
        pointsAwarded = 10;
      }
      submission.submissions.push(newSub);
    }

    // Update total score
    submission.totalScore += pointsAwarded;

    // If the participant has submissions for all questions in the challenge session, mark submission as complete
    if (submission.submissions.length === session.questions.length) {
      submission.status = 'completed';
      submission.finishedAt = new Date();
    }

    await submission.save();
    res.status(200).json({ submission });
  } catch (error) {
    console.error('Error submitting challenge answer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getChallengeSubmission = async (req, res) => {
  try {
    const { sessionId, participant } = req.params;
    const submission = await ChallengeSubmission.findOne({ challengeSession: sessionId, participant });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    console.error('Error fetching challenge submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};