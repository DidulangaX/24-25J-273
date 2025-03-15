// SkillForge\backend\services\adaptive\controllers\challengeController.js

const ChallengeSession = require('../models/ChallengeSessionModel');
const AdaptiveQuestion = require('../models/QuestionModel');
const ChallengeSubmission = require('../models/ChallengeSubmissionModel');

/**
 * POST /api/adaptive/challenge/create
 * Body: { creator, participants: [...], [questionCount=5], [difficulty='medium'] }
 */
exports.createChallengeSession = async (req, res) => {
    try {
      const { creator, participants, questionCount = 5, difficulty = 'medium', timeLimit = 300 } = req.body;
      if (!creator || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ error: 'creator and participants array are required' });
      }
  
      // 1) Pick random questions
      const questionsFromDB = await AdaptiveQuestion.aggregate([
        { $match: { difficulty } },
        { $sample: { size: questionCount } }
      ]);
  
      const challengeQuestions = questionsFromDB.map(q => ({
        question_id: q.question_id,
        prompt: q.prompt,   
        attempts: 0,
        correct: false,
        answer: ''
      }));
  
      // 2) Build participants array with accepted=false for each
      const participantsSubdocs = participants.map(p => ({
        user: p,
        accepted: false
      }));
  
      // 3) Create the session doc
      const newSession = new ChallengeSession({
        creator,
        participants: participantsSubdocs,
        questions: challengeQuestions,
        status: 'pending',
        timeLimit
      });
  
      await newSession.save();
      return res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating challenge session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  
/**
 * GET /api/adaptive/challenge/:sessionId
 * Retrieve a single challenge session by ID
 */
exports.getChallengeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChallengeSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Challenge session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching challenge session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getUserPendingChallenges = async (req, res) => {
    try {
      const { user } = req.query;
      if (!user) {
        return res.status(400).json({ error: 'user query param is required' });
      }
  
      // Find sessions with status=pending and participants array containing:
      // { user: user, accepted: false }
      const sessions = await ChallengeSession.find({
        status: 'pending',
        'participants.user': user,
        'participants.accepted': false
      });
  
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

/**
 * POST /api/adaptive/challenge/:sessionId/accept
 * Body: { user: 'usernameString' }
 * If user is a participant, set accepted=true. If all accepted => status='active'.
 */
exports.acceptChallenge = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { user } = req.body;
    if (!user) {
      return res.status(400).json({ error: 'user is required in request body' });
    }

    const session = await ChallengeSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Challenge session not found' });
    }

    // Find participant subdoc
    const participant = session.participants.find(p => p.user === user);
    if (!participant) {
      return res.status(400).json({ error: 'User not in this challenge session' });
    }

    // If already accepted, just return the session
    if (participant.accepted) {
      return res.json(session);
    }

    // Mark as accepted
    participant.accepted = true;

    // Check if all participants accepted
    const allAccepted = session.participants.every(p => p.accepted === true);

    if (allAccepted) {
      // Move from pending to active
      session.status = 'active';
      session.startTime = new Date();
      const startMs = session.startTime.getTime();
      // endTime = startTime + timeLimit * 1000
      session.endTime = new Date(startMs + (session.timeLimit * 1000));
    }

    await session.save();
    return res.json(session);
  } catch (error) {
    console.error('Error accepting challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// --------------------- Finalize Challenge Session ---------------------
// This function finalizes the challenge session by checking if all participants have completed,
// or if the time limit has expired, then computes the winner and updates the session.
exports.finalizeChallengeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChallengeSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Challenge session not found' });
    }
    
    // If already completed, return session
    if (session.status === 'completed') {
      return res.json(session);
    }

    const now = new Date();
    const timerExpired = session.endTime && now >= session.endTime;

    // Fetch all submissions for this session
    const submissions = await ChallengeSubmission.find({ challengeSession: sessionId });
    
    // Get all participants who accepted the challenge
    const participantIds = session.participants
      .filter(p => p.accepted)
      .map(p => p.user);

    // Check if all participants have completed their submissions
    let allCompleted = true;
    let results = [];

    for (const participant of participantIds) {
      const sub = submissions.find(s => s.participant === participant);
      if (!sub || sub.status !== 'completed') {
        allCompleted = false;
      }
      
      // Add participant to results array whether they completed or not
      results.push({ 
        participant, 
        totalScore: sub ? sub.totalScore : 0,
        finishedAt: sub ? sub.finishedAt : null
      });
    }

    // Only finalize if timer expired OR all participants have completed
    if (!timerExpired && !allCompleted) {
      return res.status(400).json({ 
        error: 'Challenge is still in progress.',
        allCompleted: allCompleted,
        timerExpired: timerExpired,
        participantsCompleted: results.filter(r => r.finishedAt).length,
        totalParticipants: participantIds.length
      });
    }

    // Determine the winner:
    // 1. Sort by totalScore (descending)
    // 2. If tied, sort by earliest finish time
    results.sort((a, b) => {
      // First sort by score (higher is better)
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      
      // If scores are tied, sort by finish time (earlier is better)
      // Only compare if both have finished
      if (a.finishedAt && b.finishedAt) {
        return new Date(a.finishedAt) - new Date(b.finishedAt);
      } 
      // If only one has finished, they win
      else if (a.finishedAt) {
        return -1;
      } else if (b.finishedAt) {
        return 1;
      }
      // If neither has finished, maintain original order
      return 0;
    });

    // The winner is the first participant after sorting
    const winner = results.length > 0 ? results[0].participant : null;

    // Update session with results
    session.status = 'completed';
    session.result = {
      winner,
      details: results
    };
    
    await session.save();
    return res.json(session);
  } catch (error) {
    console.error('Error finalizing challenge session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getChallengeResults = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Fetch all submissions for this challenge session
    const submissions = await ChallengeSubmission.find({ challengeSession: sessionId });
    if (!submissions || submissions.length === 0) {
      return res.status(404).json({ error: 'No submissions found for this challenge session' });
    }
    // Sort by totalScore (descending) then by finishedAt (ascending)
    submissions.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      } else {
        return new Date(a.finishedAt) - new Date(b.finishedAt);
      }
    });
    // Build a results array
    const results = submissions.map(s => ({
      participant: s.participant,
      totalScore: s.totalScore,
      finishedAt: s.finishedAt
    }));
    res.json({ results });
  } catch (error) {
    console.error('Error fetching challenge results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};