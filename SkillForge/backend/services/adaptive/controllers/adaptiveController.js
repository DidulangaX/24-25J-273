//SkillForge\backend\services\adaptive\controllers\adaptiveController.js

const axios = require('axios');
const AdaptiveQuestion = require('../models/QuestionModel');
const AdaptiveUserPerformance = require('../models/UserPerformanceModel');

// ------------- Helpers -------------

// Create Round One: Pick 2 medium questions for each topic
async function createRoundOne(user) {
  const topics = ['Recursion', 'File I/O', 'OOP', 'Loops', 'String Manipulation'];
  let roundQuestions = [];

  for (const t of topics) {
    const twoQs = await AdaptiveQuestion.aggregate([
      { $match: { topic: t, difficulty: 'medium' } },
      { $sample: { size: 2 } }
    ]);
    twoQs.forEach(q => {
      roundQuestions.push({
        question_id: q.question_id,
        attempts: 0,
        correct: false,
        done: false
      });
    });
  }

  const newRound = {
    roundNumber: 1,
    questions: roundQuestions,
    completed: false
  };

  user.rounds.push(newRound);
  user.phase = 'round1';
  await user.save();
}

// Get the current active question for the user
async function getCurrentQuestion(user_id) {
  let user = await AdaptiveUserPerformance.findOne({ user_id });
  if (!user) {
    user = new AdaptiveUserPerformance({ user_id });
    await user.save();
  }

  let currentRound = user.rounds[user.rounds.length - 1];

  if (!currentRound || currentRound.completed) {
    if (user.phase === 'round1') {
      await createRoundOne(user);
      user = await AdaptiveUserPerformance.findOne({ user_id });
      currentRound = user.rounds[user.rounds.length - 1];
    }
    // Additional phases (e.g. weakTopic) can be handled here
  }

  if (!currentRound) return null;

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
}

// Analyze Round One: update mastery based on correct/incorrect answers
async function analyzeRoundOne(user) {
  const round1 = user.rounds.find(r => r.roundNumber === 1);
  if (!round1) return;

  for (const rq of round1.questions) {
    const qDoc = await AdaptiveQuestion.findOne({ question_id: rq.question_id });
    if (!qDoc) continue;
    const t = qDoc.topic;
    
    console.log(`>>> analyzeRoundOne: question_id = ${rq.question_id}, topic = ${t}, correct = ${rq.correct}, old mastery = ${user.topic_mastery.get(t)}`);
    
    if (rq.correct) {
      user.topic_mastery.set(t, Math.min(1, (user.topic_mastery.get(t) || 0) + 0.05));
    } else {
      user.topic_mastery.set(t, Math.max(0, (user.topic_mastery.get(t) || 0) - 0.02));
    }
    
    console.log(`>>> new mastery = ${user.topic_mastery.get(t)}`);
  }
  
  round1.completed = true;
  user.phase = 'weakTopic';
  await user.save();
}

// Start a Weak-Topic Round: pick 3 medium questions from the user's weakest topic
async function startWeakTopicRound(user) {
  let weakestTopic = 'Recursion';
  for (const [topic, val] of user.topic_mastery.entries()) {
    if (val < (user.topic_mastery.get(weakestTopic) || 1)) {
      weakestTopic = topic;
    }
  }

  if ((user.topic_mastery.get(weakestTopic) || 0) >= 0.7) {
    console.log("User's weakest topic >= 0.7, maybe done or pick new topic");
    return;
  }

  const threeQs = await AdaptiveQuestion.aggregate([
    { $match: { topic: weakestTopic, difficulty: 'medium' } },
    { $sample: { size: 3 } }
  ]);

  const newRoundNumber = user.rounds.length + 1;
  const newRound = {
    roundNumber: newRoundNumber,
    questions: threeQs.map(q => ({
      question_id: q.question_id,
      attempts: 0,
      correct: false,
      done: false
    })),
    completed: false
  };

  user.rounds.push(newRound);
  await user.save();
}

// Analyze Weak Topic Round: update mastery and decide whether to continue or end
async function analyzeWeakTopicRound(user) {
  const lastRound = user.rounds[user.rounds.length - 1];
  if (!lastRound) return;

  for (const rq of lastRound.questions) {
    const qDoc = await AdaptiveQuestion.findOne({ question_id: rq.question_id });
    if (!qDoc) continue;
    const t = qDoc.topic;
    if (rq.correct) {
      user.topic_mastery.set(t, Math.min(1, (user.topic_mastery.get(t) || 0) + 0.05));
    } else {
      user.topic_mastery.set(t, Math.max(0, (user.topic_mastery.get(t) || 0) - 0.02));
    }
  }
  lastRound.completed = true;
  await user.save();

  const someQid = lastRound.questions[0].question_id;
  const doc = await AdaptiveQuestion.findOne({ question_id: someQid });
  if (!doc) return;
  const theTopic = doc.topic;

  if (user.topic_mastery.get(theTopic) >= 0.7) {
    let nextWeakTopic = null;
    for (const [topic, val] of user.topic_mastery.entries()) {
      if (val < 0.7) {
        nextWeakTopic = topic;
        break;
      }
    }
    if (!nextWeakTopic) {
      console.log('All topics >= 0.7, user done!');
      user.phase = 'done';
      await user.save();
      return;
    } else {
      await startWeakTopicRound(user);
    }
  } else {
    await startWeakTopicRound(user);
  }
}

// ------------- Controllers for Routes -------------

// GET /api/adaptive/currentQuestion?user_id=xxx
exports.getCurrentQuestion = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const nextQ = await getCurrentQuestion(user_id);
    if (!nextQ) {
      return res.json({ message: 'No active question; maybe round is complete.' });
    }
    res.json(nextQ);
  } catch (err) {
    console.error('Error in getCurrentQuestion:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/adaptive/answer
exports.submitAnswer = async (req, res) => {
    try {
      const { user_id, question_id, user_answer } = req.body;
      if (!user_id || !question_id || !user_answer) {
        return res.status(400).json({ error: 'user_id, question_id, user_answer are required.' });
      }
  
      // get question doc
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
  
      // find user doc
      let user = await AdaptiveUserPerformance.findOne({ user_id });
      if (!user) {
        user = new AdaptiveUserPerformance({ user_id });
        await user.save();
      }
  
      // find the current round
      let currentRound = user.rounds[user.rounds.length - 1];
      if (!currentRound) {
        return res.status(400).json({ error: 'No active round' });
      }
  
      // find the question subdoc
      const qSub = currentRound.questions.find(q => q.question_id === question_id && !q.done);
      if (!qSub) {
        return res.status(400).json({ error: 'Question not active or already done' });
      }
  
      // update attempts / correctness
      if (isCorrect) {
        qSub.correct = true;
        qSub.done = true;
        // Award points
        if (qSub.attempts === 0) {
          user.total_score += 10; // correct on 1st attempt
        } else if (qSub.attempts === 1) {
          user.total_score += 5;  // correct on 2nd attempt
        } else if (qSub.attempts === 2) {
          user.total_score += 2;  // correct on 3rd attempt
        }
      } else {
        qSub.attempts += 1;
        if (qSub.attempts >= 3) {
          qSub.done = true; // used up attempts
        }
      }
  
      // check if all done
      const allDone = currentRound.questions.every(q => q.done);
      if (allDone) {
        currentRound.completed = true;
        if (currentRound.roundNumber === 1 && user.phase === 'round1') {
          await analyzeRoundOne(user);
          await startWeakTopicRound(user);
        } else if (user.phase === 'weakTopic') {
          await analyzeWeakTopicRound(user);
        }
      }
  
      await user.save();
  
      // fetch next question
      const nextQ = await getCurrentQuestion(user_id);
      res.json({
        classification,
        next_question: nextQ ? nextQ : { message: 'No further question.' }
      });
    } catch (err) {
      console.error('Error processing answer:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
  