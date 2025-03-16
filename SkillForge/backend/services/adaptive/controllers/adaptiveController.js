// File: SkillForge/backend/services/adaptive/controllers/adaptiveController.js

const axios = require('axios');
const AdaptiveQuestion = require('../models/QuestionModel');
const TestSession = require('../models/TestSessionModel');

// -------------- HELPER: getBadgeByScore --------------
function getBadgeByScore(score) {
  if (score >= 300) return 'Diamond';
  if (score >= 200) return 'Platinum';
  if (score >= 100) return 'Gold';
  if (score >= 50)  return 'Silver';
  if (score >= 10)  return 'Bronze';
  return '';
}

// -------------- HELPER: create a new round --------------
async function createRound(session, roundNumber) {
  const randomQuestions = await AdaptiveQuestion.aggregate([
    { $sample: { size: 10 } }  // pick 10 random
  ]);

  const roundQuestions = randomQuestions.map(q => ({
    question_id: q.question_id,
    attempts: 0,
    correct: false,
    done: false,
    startTime: null,
    endTime: null
  }));

  const newRound = {
    roundNumber,
    questions: roundQuestions,
    completed: false,
    startTime: new Date(),
    timeLimit: 600
  };

  session.rounds.push(newRound);
  // update session.phase
  if (roundNumber === 1) session.phase = 'round1';
  if (roundNumber === 2) session.phase = 'round2';
  if (roundNumber === 3) session.phase = 'round3';
}

// -------------- HELPER: get or create the active session --------------
async function getActiveSession(user_id) {
  // see if there's an existing session with phase != 'finished'
  let session = await TestSession.findOne({ user_id, phase: { $ne: 'finished' } });
  if (!session) {
    // if none found, return null => means user might need to create a new attempt
    return null;
  }
  return session;
}

// -------------- HELPER: get current round from session --------------
function getCurrentRound(session) {
  if (!session.rounds || session.rounds.length === 0) return null;
  const lastRound = session.rounds[session.rounds.length - 1];
  if (!lastRound.completed) return lastRound;
  return null;
}

// -------------- HELPER: move to next phase --------------
async function moveToNextPhase(session) {
  const phase = session.phase;
  if (phase === 'round1') {
    await createRound(session, 2);
  } else if (phase === 'round2') {
    await createRound(session, 3);
  } else if (phase === 'round3') {
    session.phase = 'finished';
    // assign badge
    session.badge = getBadgeByScore(session.total_score);
  }
  await session.save();
}

// -------------- HELPER: mastery calculation (optional advanced) --------------
function calculateMasteryDelta({ difficulty, correct, attempts, timeUsed, timeLimit }) {
  let delta = 0;
  if (!correct) {
    delta = -0.02 * (1 + attempts / 2);
    return delta;
  }
  let base = 0;
  switch (difficulty) {
    case 'easy':   base = 0.04; break;
    case 'medium': base = 0.06; break;
    case 'hard':   base = 0.08; break;
    default:       base = 0.05;
  }
  if (attempts === 0) base *= 1.0;
  else if (attempts === 1) base *= 0.7;
  else base *= 0.5;

  const ratio = timeUsed / timeLimit;
  if (ratio < 0.5) base *= 1.1;
  else if (ratio > 0.9) base *= 0.9;

  delta = base;
  return delta;
}

// -------------- CONTROLLER: create a new attempt --------------
// POST /api/adaptive/newAttempt
exports.createNewAttempt = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // find how many attempts user has done so far
    const latestAttempt = await TestSession.findOne({ user_id }).sort({ attemptNumber: -1 });
    let attemptNumber = 1;
    if (latestAttempt) {
      attemptNumber = latestAttempt.attemptNumber + 1;
    }

    // create a fresh session doc
    const session = new TestSession({
      user_id,
      attemptNumber,
      phase: 'round1',
      total_score: 0
    });

    // create round1
    await createRound(session, 1);
    await session.save();

    return res.json({
      message: `New attempt #${attemptNumber} created for user ${user_id}.`,
      session_id: session._id,
      attemptNumber: attemptNumber
    });
  } catch (err) {
    console.error('Error creating new attempt:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------- CONTROLLER: getCurrentQuestion --------------
// GET /api/adaptive/currentQuestion?user_id=xxx
exports.getCurrentQuestion = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // find the active session
    let session = await getActiveSession(user_id);
    if (!session) {
      // no active session => user might need to create new attempt or is finished
      return res.json({ message: 'No active session. Please create a new attempt or user is finished.' });
    }

    // get or create the current round
    let currentRound = getCurrentRound(session);
    if (!currentRound) {
      // if the last round was completed, we go to next phase
      if (session.phase !== 'finished') {
        await moveToNextPhase(session);
        session = await TestSession.findById(session._id); // refresh
        currentRound = getCurrentRound(session);
      }
      if (!currentRound) {
        // still no round => maybe finished
        if (session.phase === 'finished') {
          return res.json({ message: 'Session is finished.' });
        } else {
          return res.json({ message: 'No active round, but session not finished?' });
        }
      }
    }

    // find the first not-done question
    const qIndex = currentRound.questions.findIndex(q => !q.done);
    if (qIndex === -1) {
      return res.json({ message: 'All questions in this round are done. Round completed.' });
    }

    const question_id = currentRound.questions[qIndex].question_id;
    const questionDoc = await AdaptiveQuestion.findOne({ question_id });
    if (!questionDoc) {
      return res.status(404).json({ error: 'Question doc not found in DB' });
    }

    // set startTime if null
    const qSub = currentRound.questions[qIndex];
    if (!qSub.startTime) {
      qSub.startTime = new Date();
      await session.save();
    }

    return res.json({
      question_id: questionDoc.question_id,
      prompt: questionDoc.prompt,
      topic: questionDoc.topic,
      difficulty: questionDoc.difficulty
    });
  } catch (err) {
    console.error('Error in getCurrentQuestion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------- CONTROLLER: submitAnswer --------------
// POST /api/adaptive/answer
exports.submitAnswer = async (req, res) => {
  try {
    const { user_id, question_id, user_answer } = req.body;
    if (!user_id || !question_id || !user_answer) {
      return res.status(400).json({ error: 'user_id, question_id, user_answer are required.' });
    }

    // find active session
    let session = await getActiveSession(user_id);
    if (!session) {
      return res.status(400).json({ error: 'No active session. Create a new attempt first.' });
    }

    // find the current round
    let currentRound = getCurrentRound(session);
    if (!currentRound) {
      return res.status(400).json({ error: 'No active round in this session.' });
    }

    // find the question subdoc
    const qSub = currentRound.questions.find(q => q.question_id === question_id && !q.done);
    if (!qSub) {
      return res.status(400).json({ error: 'Question not active or already done.' });
    }

    // find question doc
    const questionDoc = await AdaptiveQuestion.findOne({ question_id });
    if (!questionDoc) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // call python microservice
    const mlData = {
      instruction: questionDoc.prompt,
      input_text: '',
      user_answer
    };
    const mlResponse = await axios.post('http://localhost:5001/classify', mlData);
    const classification = mlResponse.data.label;
    const isCorrect = (classification === 'correct');

    // set endTime
    qSub.endTime = new Date();
    const timeUsedSeconds = (qSub.endTime - qSub.startTime) / 1000;
    const roundTimeLimit = currentRound.timeLimit || 600;

    // handle correctness + scoring
    if (isCorrect) {
      qSub.correct = true;
      qSub.done = true;
      if (qSub.attempts === 0) session.total_score += 10;
      else if (qSub.attempts === 1) session.total_score += 5;
      else if (qSub.attempts === 2) session.total_score += 2;
    } else {
      qSub.attempts += 1;
      if (qSub.attempts >= 3) {
        qSub.done = true; // used up attempts
      }
    }

    // mastery update
    const topic = questionDoc.topic;
    const oldVal = session.topic_mastery.get(topic) || 0.5;
    const masteryChange = calculateMasteryDelta({
      difficulty: questionDoc.difficulty,
      correct: isCorrect,
      attempts: qSub.attempts,
      timeUsed: timeUsedSeconds,
      timeLimit: roundTimeLimit
    });
    session.topic_mastery.set(topic, Math.min(1, Math.max(0, oldVal + masteryChange)));

    await session.save();

    // check if all done in this round
    const allDone = currentRound.questions.every(q => q.done);
    if (allDone) {
      currentRound.completed = true;
      await session.save();

      // if roundNumber=3, finishing might set session.phase='finished'
      await moveToNextPhase(session);
      // refresh session
      session = await TestSession.findById(session._id);
    }

    // fetch next question
    const nextQ = await exports.getNextQuestionInternal(session);
    res.json({
      classification,
      next_question: nextQ ? nextQ : { message: 'No further question.' }
    });
  } catch (err) {
    console.error('Error in submitAnswer:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// internal helper to fetch next question object from the session
exports.getNextQuestionInternal = async (session) => {
  const currentRound = getCurrentRound(session);
  if (!currentRound) {
    return null;
  }
  const qIndex = currentRound.questions.findIndex(q => !q.done);
  if (qIndex === -1) return null;
  const question_id = currentRound.questions[qIndex].question_id;
  const questionDoc = await AdaptiveQuestion.findOne({ question_id });
  if (!questionDoc) return null;

  return {
    question_id: questionDoc.question_id,
    prompt: questionDoc.prompt,
    topic: questionDoc.topic,
    difficulty: questionDoc.difficulty
  };
};

// -------------- CONTROLLER: getFinalSummary --------------
// GET /api/adaptive/finalSummary?user_id=xxx&attemptNumber=yyy
exports.getFinalSummary = async (req, res) => {
  try {
    const { user_id, attemptNumber } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    if (!attemptNumber) {
      return res.status(400).json({ error: 'attemptNumber is required' });
    }

    const session = await TestSession.findOne({ user_id, attemptNumber });
    if (!session) {
      return res.status(404).json({ error: 'Session not found for that user & attemptNumber' });
    }

    // If user not finished, can still give partial data or an error
    if (session.phase !== 'finished') {
      return res.json({
        message: 'This session is not finished yet.',
        phase: session.phase
      });
    }

    // build summary
    const summary = {
      user_id: session.user_id,
      attemptNumber: session.attemptNumber,
      phase: session.phase,
      total_score: session.total_score,
      badge: session.badge,
      topic_mastery: Object.fromEntries(session.topic_mastery.entries()),
      difficulty_mastery: Object.fromEntries(session.difficulty_mastery.entries()),
      rounds: session.rounds.map(r => ({
        roundNumber: r.roundNumber,
        correctCount: r.questions.filter(q => q.correct).length,
        totalQuestions: r.questions.length
      }))
    };

    return res.json(summary);
  } catch (err) {
    console.error('Error in getFinalSummary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------- CONTROLLER: getAllAttemptsForUser --------------
// GET /api/adaptive/allAttempts?user_id=xxx
// to see a quick summary of all attempts
exports.getAllAttemptsForUser = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const allSessions = await TestSession.find({ user_id }).sort({ attemptNumber: 1 });
    const results = allSessions.map(s => ({
      attemptNumber: s.attemptNumber,
      phase: s.phase,
      total_score: s.total_score,
      badge: s.badge,
      createdAt: s.createdAt
    }));

    return res.json(results);
  } catch (err) {
    console.error('Error in getAllAttemptsForUser:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
