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

// -------------- HELPER: Question Difficulty Distribution --------------
async function getQuestionsForRound(roundNumber, session) {
  const roundSettings = session.roundSettings[`round${roundNumber}`];
  const { easyPercentage, mediumPercentage, hardPercentage } = roundSettings;
  
  const totalQuestions = 10; // Each round has 10 questions
  const easyCount = Math.round(totalQuestions * easyPercentage / 100);
  const mediumCount = Math.round(totalQuestions * mediumPercentage / 100);
  const hardCount = totalQuestions - easyCount - mediumCount;
  
  // Get questions based on topic mastery
  const topicMastery = session.topic_mastery;
  
  // Convert Map to array of [topic, mastery] pairs and sort by mastery (ascending)
  const topicMasteryArray = Array.from(topicMastery.entries())
    .sort((a, b) => a[1] - b[1]);
  
  // Prioritize topics with lower mastery
  const lowMasteryTopics = topicMasteryArray.slice(0, Math.ceil(topicMasteryArray.length / 2))
    .map(([topic]) => topic);
  const highMasteryTopics = topicMasteryArray.slice(Math.ceil(topicMasteryArray.length / 2))
    .map(([topic]) => topic);
  
  // Fetch questions - we'll weight toward topics with lower mastery
  const lowMasteryWeight = 0.7; // 70% of questions from low mastery topics
  const highMasteryWeight = 0.3; // 30% of questions from high mastery topics
  
  // Get questions of each difficulty with topic weighting
  let easyQuestions = await getQuestionsWithTopicWeighting('easy', easyCount, lowMasteryTopics, highMasteryTopics, lowMasteryWeight, highMasteryWeight);
  let mediumQuestions = await getQuestionsWithTopicWeighting('medium', mediumCount, lowMasteryTopics, highMasteryTopics, lowMasteryWeight, highMasteryWeight);
  let hardQuestions = await getQuestionsWithTopicWeighting('hard', hardCount, lowMasteryTopics, highMasteryTopics, lowMasteryWeight, highMasteryWeight);

  // Combine all questions and map to question subdocuments
  const allQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions];
  
  // Shuffle the questions to avoid predictable difficulty progression
  const shuffledQuestions = shuffleArray(allQuestions);
  
  return shuffledQuestions.map(q => ({
    question_id: q.question_id,
    attempts: 0,
    correct: false,
    done: false,
    startTime: null,
    endTime: null,
    topic: q.topic,
    difficulty: q.difficulty
  }));
}

// -------------- HELPER: Get Questions With Topic Weighting --------------
async function getQuestionsWithTopicWeighting(difficulty, count, lowMasteryTopics, highMasteryTopics, lowMasteryWeight, highMasteryWeight) {
  if (count <= 0) return [];
  
  const lowMasteryCount = Math.ceil(count * lowMasteryWeight);
  const highMasteryCount = count - lowMasteryCount;
  
  let questions = [];
  
  if (lowMasteryCount > 0) {
    const lowMasteryQuestions = await AdaptiveQuestion.aggregate([
      { $match: { difficulty, topic: { $in: lowMasteryTopics } } },
      { $sample: { size: lowMasteryCount } }
    ]);
    questions = questions.concat(lowMasteryQuestions);
  }
  
  if (highMasteryCount > 0) {
    const highMasteryQuestions = await AdaptiveQuestion.aggregate([
      { $match: { difficulty, topic: { $in: highMasteryTopics } } },
      { $sample: { size: highMasteryCount } }
    ]);
    questions = questions.concat(highMasteryQuestions);
  }
  
  // If we didn't get enough questions, fill with random questions of the right difficulty
  if (questions.length < count) {
    const remainingCount = count - questions.length;
    const existingIds = questions.map(q => q.question_id);
    
    const additionalQuestions = await AdaptiveQuestion.aggregate([
      { $match: { difficulty, question_id: { $nin: existingIds } } },
      { $sample: { size: remainingCount } }
    ]);
    
    questions = questions.concat(additionalQuestions);
  }
  
  return questions;
}

// -------------- HELPER: Shuffle Array --------------
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// -------------- HELPER: create a new round --------------
async function createRound(session, roundNumber) {
  const roundQuestions = await getQuestionsForRound(roundNumber, session);
  
  const newRound = {
    roundNumber,
    questions: roundQuestions,
    completed: false,
    startTime: new Date(),
    endTime: null,
    timeLimit: session.roundSettings[`round${roundNumber}`].timeLimit,
    minPassingScore: session.roundSettings[`round${roundNumber}`].minPassingScore,
    score: 0,
    passed: false
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

// -------------- HELPER: generate round summary --------------
function generateRoundSummary(round) {
  const questions = round.questions;
  const correctAnswers = questions.filter(q => q.correct).length;
  const totalQuestions = questions.length;
  
  // Calculate time spent
  let totalTimeSpent = 0;
  for (const q of questions) {
    if (q.startTime && q.endTime) {
      totalTimeSpent += (q.endTime - q.startTime) / 1000; // in seconds
    }
  }
  
  // Calculate topic performance
  const topicPerformance = new Map();
  const difficultyPerformance = new Map();
  
  for (const q of questions) {
    // Topic performance
    if (!topicPerformance.has(q.topic)) {
      topicPerformance.set(q.topic, { correct: 0, total: 0, percentage: 0 });
    }
    
    const topicStats = topicPerformance.get(q.topic);
    topicStats.total += 1;
    if (q.correct) topicStats.correct += 1;
    topicStats.percentage = (topicStats.correct / topicStats.total) * 100;
    
    // Difficulty performance
    if (!difficultyPerformance.has(q.difficulty)) {
      difficultyPerformance.set(q.difficulty, { correct: 0, total: 0, percentage: 0 });
    }
    
    const diffStats = difficultyPerformance.get(q.difficulty);
    diffStats.total += 1;
    if (q.correct) diffStats.correct += 1;
    diffStats.percentage = (diffStats.correct / diffStats.total) * 100;
  }
  
  // Calculate score (percentage of correct answers)
  const score = (correctAnswers / totalQuestions) * 100;
  
  // Check if passed
  const passed = score >= round.minPassingScore;
  
  // Update round info
  round.score = score;
  round.passed = passed;
  round.endTime = new Date();
  
  return {
    roundNumber: round.roundNumber,
    score,
    correctAnswers,
    totalQuestions,
    timeSpent: totalTimeSpent,
    topicPerformance,
    difficultyPerformance,
    passed
  };
}

// -------------- HELPER: move to next phase (continued) --------------
async function moveToNextPhase(session) {
  const phase = session.phase;
  
  // Get the current round
  const currentRound = getCurrentRound(session) || session.rounds[session.rounds.length - 1];
  
  // Generate and save the round summary
  const roundSummary = generateRoundSummary(currentRound);
  session.roundSummaries.push(roundSummary);
  
  // Check if user passed the round
  if (!roundSummary.passed) {
    // User did not pass - they must retry this round
    // We don't advance to the next round
    
    // Create a new attempt at the same round
    if (phase === 'round1') {
      await createRound(session, 1);
    } else if (phase === 'round2') {
      await createRound(session, 2);
    } else if (phase === 'round3') {
      await createRound(session, 3);
    }
  } else {
    // User passed this round, proceed to next round or finish
    if (phase === 'round1') {
      await createRound(session, 2);
    } else if (phase === 'round2') {
      await createRound(session, 3);
    } else if (phase === 'round3') {
      session.phase = 'finished';
      // Calculate final score based on all rounds
      let totalScore = 0;
      for (const summary of session.roundSummaries) {
        // Weight later rounds more heavily
        const roundWeight = summary.roundNumber === 1 ? 1 : 
                           summary.roundNumber === 2 ? 1.5 : 2;
        totalScore += summary.score * roundWeight;
      }
      
      // Normalize the score to scale of 0-350
      totalScore = Math.min(350, Math.round(totalScore / 4.5));
      session.total_score = totalScore;
      
      // Assign badge
      session.badge = getBadgeByScore(totalScore);
    }
  }
  
  await session.save();
}

// -------------- HELPER: smart next question selection --------------
async function selectNextQuestion(session, currentRoundNumber) {
  const currentRound = session.rounds.find(r => r.roundNumber === currentRoundNumber && !r.completed);
  if (!currentRound) return null;
  
  // Find which questions haven't been done yet
  const remainingQuestions = currentRound.questions.filter(q => !q.done);
  if (remainingQuestions.length === 0) return null;
  
  // Get current mastery levels
  const topicMastery = session.topic_mastery;
  const difficultyMastery = session.difficulty_mastery;
  
  // Check user's performance in current round so far
  const questionsAnswered = currentRound.questions.filter(q => q.done);
  const recentCorrect = questionsAnswered.slice(-3).filter(q => q.correct).length;
  
  // If user struggling (< 33% correct in recent questions), prefer easier questions
  const isStruggling = questionsAnswered.length >= 3 && (recentCorrect / Math.min(questionsAnswered.length, 3)) < 0.33;
  
  // If user doing very well (> 80% correct), prefer harder questions
  const isExcelling = questionsAnswered.length >= 3 && (recentCorrect / Math.min(questionsAnswered.length, 3)) > 0.8;
  
  // Set preferred difficulties based on performance
  let preferredDifficulties = ['easy', 'medium', 'hard'];
  
  if (isStruggling) {
    preferredDifficulties = ['easy', 'medium', 'hard']; // Prioritize easier questions
  } else if (isExcelling) {
    preferredDifficulties = ['hard', 'medium', 'easy']; // Prioritize harder questions
  } else {
    // Normal distribution based on round
    if (currentRoundNumber === 1) {
      preferredDifficulties = ['easy', 'medium', 'hard'];
    } else if (currentRoundNumber === 2) {
      preferredDifficulties = ['medium', 'easy', 'hard'];
    } else {
      preferredDifficulties = ['hard', 'medium', 'easy'];
    }
  }
  
  // Sort topics by lowest mastery first
  const sortedTopics = Array.from(topicMastery.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([topic]) => topic);
  
  // First try to find a question with preferred difficulty and lowest mastery topic
  for (const difficulty of preferredDifficulties) {
    for (const topic of sortedTopics) {
      const question = remainingQuestions.find(q => q.difficulty === difficulty && q.topic === topic);
      if (question) return question;
    }
  }
  
  // If no ideal match, return the first remaining question
  return remainingQuestions[0];
}

// -------------- HELPER: mastery calculation --------------
function calculateMasteryDelta({ difficulty, topic, correct, attempts, timeUsed, timeLimit }) {
  let delta = 0;
  if (!correct) {
    delta = -0.02 * (1 + attempts / 2);
    return { topic: delta, difficulty: delta };
  }
  
  let baseTopic = 0;
  let baseDifficulty = 0;
  
  switch (difficulty) {
    case 'easy':   
      baseTopic = 0.03; 
      baseDifficulty = 0.04;
      break;
    case 'medium': 
      baseTopic = 0.05; 
      baseDifficulty = 0.06;
      break;
    case 'hard':   
      baseTopic = 0.07; 
      baseDifficulty = 0.08;
      break;
    default:       
      baseTopic = 0.04;
      baseDifficulty = 0.05;
  }
  
  // Adjust based on attempts
  const attemptMultiplier = attempts === 0 ? 1.0 : 
                           attempts === 1 ? 0.7 : 0.5;
  
  baseTopic *= attemptMultiplier;
  baseDifficulty *= attemptMultiplier;
  
  // Adjust based on time
  const timeRatio = timeUsed / timeLimit;
  const timeMultiplier = timeRatio < 0.5 ? 1.1 : 
                        timeRatio > 0.9 ? 0.9 : 1.0;
  
  baseTopic *= timeMultiplier;
  baseDifficulty *= timeMultiplier;
  
  return { 
    topic: baseTopic,
    difficulty: baseDifficulty
  };
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
      return res.json({ 
        status: 'no_active_session',
        message: 'No active session. Please create a new attempt or user is finished.' 
      });
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
          return res.json({ 
            status: 'finished',
            message: 'Session is finished.',
            roundSummaries: session.roundSummaries,
            badge: session.badge,
            total_score: session.total_score
          });
        } else {
          return res.json({ 
            status: 'error',
            message: 'No active round, but session not finished?' 
          });
        }
      }
    }

    // Get the next question using our smart selection
    const nextQuestion = await selectNextQuestion(session, currentRound.roundNumber);
    if (!nextQuestion) {
      // All questions completed, end the round
      currentRound.completed = true;
      await session.save();
      
      // Generate round summary
      const summary = generateRoundSummary(currentRound);
      
      return res.json({
        status: 'round_completed',
        message: 'All questions in this round are done.',
        roundNumber: currentRound.roundNumber,
        summary: summary
      });
    }

    const question_id = nextQuestion.question_id;
    const questionDoc = await AdaptiveQuestion.findOne({ question_id });
    if (!questionDoc) {
      return res.status(404).json({ error: 'Question doc not found in DB' });
    }

    // set startTime if null
    if (!nextQuestion.startTime) {
      nextQuestion.startTime = new Date();
      await session.save();
    }

    // Check time limit for the round
    const timeLimitExceeded = isTimeLimitExceeded(currentRound);
    if (timeLimitExceeded) {
      currentRound.completed = true;
      await session.save();
      
      // Move to next phase
      await moveToNextPhase(session);
      
      return res.json({
        status: 'time_limit_exceeded',
        message: 'Time limit for this round has been exceeded.',
        timeLimit: currentRound.timeLimit,
        roundNumber: currentRound.roundNumber
      });
    }

    // Send time remaining for the round
    const timeRemaining = getTimeRemaining(currentRound);

    return res.json({
      status: 'question',
      question_id: questionDoc.question_id,
      prompt: questionDoc.prompt,
      topic: questionDoc.topic,
      difficulty: questionDoc.difficulty,
      roundNumber: currentRound.roundNumber,
      questionNumber: currentRound.questions.filter(q => q.done).length + 1,
      totalQuestions: currentRound.questions.length,
      timeRemaining: timeRemaining
    });
  } catch (err) {
    console.error('Error in getCurrentQuestion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------- HELPER: Check if round time limit exceeded --------------
function isTimeLimitExceeded(round) {
  if (!round.startTime) return false;
  const now = new Date();
  const elapsedSeconds = (now - round.startTime) / 1000;
  return elapsedSeconds > round.timeLimit;
}

// -------------- HELPER: Get time remaining for round --------------
function getTimeRemaining(round) {
  if (!round.startTime) return round.timeLimit;
  const now = new Date();
  const elapsedSeconds = (now - round.startTime) / 1000;
  const remaining = Math.max(0, round.timeLimit - elapsedSeconds);
  return Math.round(remaining);
}

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

    // Check if time limit exceeded
    const timeLimitExceeded = isTimeLimitExceeded(currentRound);
    if (timeLimitExceeded) {
      currentRound.completed = true;
      await session.save();
      
      // Move to next phase
      await moveToNextPhase(session);
      
      return res.json({
        status: 'time_limit_exceeded',
        message: 'Time limit for this round has been exceeded.',
        timeLimit: currentRound.timeLimit,
        roundNumber: currentRound.roundNumber
      });
    }

    // find the question subdoc
    const qIndex = currentRound.questions.findIndex(q => q.question_id === question_id && !q.done);
    if (qIndex === -1) {
      return res.status(400).json({ error: 'Question not active or already done.' });
    }
    const qSub = currentRound.questions[qIndex];

    // find question doc
    const questionDoc = await AdaptiveQuestion.findOne({ question_id });
    if (!questionDoc) {
      return res.status(404).json({ error: 'Question not found' });
    }

     // call python microservice and determine isCorrect
     const mlData = { instruction: questionDoc.prompt, input_text: '', user_answer };
     const mlResponse = await axios.post('http://localhost:5001/classify', mlData);
     const classification = mlResponse.data.label;
     const isCorrect = (classification === 'correct');
 
     // set endTime and calculate time used
     qSub.endTime = new Date();
     const timeUsedSeconds = (qSub.endTime - qSub.startTime) / 1000;
     const roundTimeLimit = currentRound.timeLimit || 600;
 
     // Declare points in outer scope
     let points = 0;
 
     if (isCorrect) {
       qSub.correct = true;
       qSub.done = true;
       
       // Calculate score based on difficulty and attempts
       
       // Base points by difficulty
       if (questionDoc.difficulty === 'easy') points = 10;
       else if (questionDoc.difficulty === 'medium') points = 15;
       else if (questionDoc.difficulty === 'hard') points = 20;
       
       // Adjust based on attempts
       if (qSub.attempts === 0) points = points * 1.0;     // Full points for first attempt
       else if (qSub.attempts === 1) points = points * 0.7; // 70% for second attempt
       else if (qSub.attempts === 2) points = points * 0.4; // 40% for third attempt
       else points = points * 0.2;                         // 20% for more attempts
       
       // Time bonus - faster answers get more points
       const timeRatio = timeUsedSeconds / (roundTimeLimit / 10); // Expected time per question
       if (timeRatio < 0.5) points = points * 1.2;  // 20% bonus for very fast answers
       else if (timeRatio < 0.8) points = points * 1.1;  // 10% bonus for fast answers
       
       // Add points to session score
       session.total_score += Math.round(points);
     } else {
       // Wrong answer
       qSub.attempts += 1;
       if (qSub.attempts >= 3) {
         qSub.done = true; // Used up attempts
       }
     }
     
     await session.save();

// Update mastery levels
const topic = questionDoc.topic;
const difficulty = questionDoc.difficulty;

// Calculate mastery changes
const masteryChanges = calculateMasteryDelta({
  difficulty,
  topic,
  correct: isCorrect,
  attempts: qSub.attempts,
  timeUsed: timeUsedSeconds,
  timeLimit: roundTimeLimit / 10 // per question time limit
});

// Update topic mastery
const topicOldVal = session.topic_mastery.get(topic) || 0.5;
session.topic_mastery.set(
  topic, 
  Math.min(1, Math.max(0, topicOldVal + masteryChanges.topic))
);

// Update difficulty mastery
const difficultyOldVal = session.difficulty_mastery.get(difficulty) || 0.5;
session.difficulty_mastery.set(
  difficulty,
  Math.min(1, Math.max(0, difficultyOldVal + masteryChanges.difficulty))
);

await session.save();

// Check if all questions are done in this round
const allDone = currentRound.questions.every(q => q.done);
if (allDone) {
  currentRound.completed = true;
  await session.save();
  
  // Generate round summary
  const summary = generateRoundSummary(currentRound);
  session.roundSummaries.push(summary);
  await session.save();

  // Move to next phase if applicable
  await moveToNextPhase(session);
  
  // Refresh session
  session = await TestSession.findById(session._id);
  
  // Check if session is now finished
  if (session.phase === 'finished') {
    return res.json({
      status: 'challenge_complete',
      classification,
      isCorrect,
      points: isCorrect ? Math.round(points) : 0,
      message: 'Congratulations! You have completed all rounds.',
      total_score: session.total_score,
      badge: session.badge,
      roundSummaries: session.roundSummaries
    });
  }
  
  // Return round summary
  return res.json({
    status: 'round_complete',
    classification,
    isCorrect,
    points: isCorrect ? Math.round(points) : 0,
    message: 'Round completed!',
    roundNumber: currentRound.roundNumber,
    summary: summary,
    passed: summary.passed,
    nextRound: summary.passed ? currentRound.roundNumber + 1 : currentRound.roundNumber
  });
}

// Select next question
const nextQuestion = await exports.getNextQuestionInternal(session);

    // When sending the response, points is now in scope.
    res.json({
      status: 'answer_submitted',
      classification,
      isCorrect,
      points: isCorrect ? Math.round(points) : 0,
      attempts: qSub.attempts,
      maxAttempts: 3,
      next_question: nextQuestion || { message: 'No further question.' }
    });
  } catch (err) {
    console.error('Error in submitAnswer:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// -------------- HELPER: Get next question internal --------------
exports.getNextQuestionInternal = async (session) => {
  const currentRound = getCurrentRound(session);
  if (!currentRound) return null;
  
  // Use smart selection for next question
  const nextQuestion = await selectNextQuestion(session, currentRound.roundNumber);
  if (!nextQuestion) return null;
  
  const questionDoc = await AdaptiveQuestion.findOne({ question_id: nextQuestion.question_id });
  if (!questionDoc) return null;

  return {
    question_id: questionDoc.question_id,
    prompt: questionDoc.prompt,
    topic: questionDoc.topic,
    difficulty: questionDoc.difficulty,
    roundNumber: currentRound.roundNumber,
    questionNumber: currentRound.questions.filter(q => q.done).length + 1,
    totalQuestions: currentRound.questions.length,
    timeRemaining: getTimeRemaining(currentRound)
  };
};

// -------------- CONTROLLER: getRoundSummary --------------
// GET /api/adaptive/roundSummary?user_id=xxx&roundNumber=1
exports.getRoundSummary = async (req, res) => {
  try {
    const { user_id, roundNumber } = req.query;
    if (!user_id || !roundNumber) {
      return res.status(400).json({ error: 'user_id and roundNumber are required' });
    }
    
    const session = await TestSession.findOne({ 
      user_id, 
      'roundSummaries.roundNumber': parseInt(roundNumber)
    });
    
    if (!session) {
      return res.status(404).json({ error: 'No summary found for this user and round' });
    }
    
    const summary = session.roundSummaries.find(s => s.roundNumber === parseInt(roundNumber));
    if (!summary) {
      return res.status(404).json({ error: 'Round summary not found' });
    }
    
    return res.json({
      status: 'success',
      summary: summary,
      passed: summary.passed,
      nextRound: summary.passed ? parseInt(roundNumber) + 1 : parseInt(roundNumber)
    });
  } catch (err) {
    console.error('Error in getRoundSummary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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
        status: 'in_progress',
        message: 'This session is not finished yet.',
        phase: session.phase,
        roundSummaries: session.roundSummaries
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
      roundSummaries: session.roundSummaries,
      createdAt: session.createdAt,
      completedAt: session.updatedAt
    };

    return res.json({
      status: 'success',
      summary
    });
  } catch (err) {
    console.error('Error in getFinalSummary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------- CONTROLLER: getAllAttemptsForUser --------------
// GET /api/adaptive/allAttempts?user_id=xxx
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
      roundSummaries: s.roundSummaries,
      createdAt: s.createdAt,
      completedAt: s.phase === 'finished' ? s.updatedAt : null
    }));

    return res.json({
      status: 'success',
      attempts: results
    });
  } catch (err) {
    console.error('Error in getAllAttemptsForUser:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};