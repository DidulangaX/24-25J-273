//SkillForge\frontend\src\components\adaptive\AdaptiveQuestionPage.js
import React, { useState, useEffect } from 'react';

function AdaptiveQuestionPage() {
  // Hard-code a user ID for demonstration
  const userId ='User133';

  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  // 1) On mount, fetch the current question
  useEffect(() => {
    fetchCurrentQuestion();
    // eslint-disable-next-line
  }, []);

  // 2) Fetch the current question from the backend
  const fetchCurrentQuestion = async () => {
    try {
        console.log("LOGGGIFF", userId);
      const response = await fetch(
        'http://localhost:8051/api/adaptive/currentQuestion?user_id=' + userId
      );
      const data = await response.json();
      if (data.message) {
        // e.g. "No active question; maybe the round is complete."
        setQuestion(null);
        setFeedback(data.message);
      } else {
        setQuestion(data);
        setFeedback(''); // clear any old feedback
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      setFeedback('Error fetching question.');
    }
  };

  // 3) Submit user’s answer => triggers the ML microservice call
  const handleSubmitAnswer = async () => {
    if (!question) {
      setFeedback('No question is currently active.');
      return;
    }

    const payload = {
      user_id: userId,
      question_id: question.question_id,
      user_answer: userAnswer,
    };

    try {
      const response = await fetch('http://localhost:8051/api/adaptive/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      // data.classification might be "correct", "Incomplete Answer", or "Syntax Error"
      if (data.classification) {
        setFeedback(`Classification: ${data.classification}`);
      }
      // If there's a next question
      if (data.next_question && data.next_question.question_id) {
        setQuestion(data.next_question);
        setUserAnswer('');
      }
      // Or if the server says no further questions
      else if (data.next_question && data.next_question.message) {
        setQuestion(null);
        setFeedback(data.next_question.message);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setFeedback('Error submitting answer.');
    }
  };

  // 4) If no question is currently available
  if (!question) {
    return (
      <div style={styles.container}>
        <h2>Adaptive Learning</h2>
        <p>{feedback || 'No question available at the moment.'}</p>
      </div>
    );
  }

  // 5) Otherwise, display the question prompt + an answer text area
  return (
    <div style={styles.container}>
      <h2>Adaptive Learning</h2>
      <div style={styles.questionBlock}>
        <strong>Prompt:</strong> {question.prompt}
      </div>

      <textarea
        style={styles.textarea}
        rows={8}
        cols={60}
        placeholder="Type your code or answer here..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
      />

      <br />
      <button onClick={handleSubmitAnswer}>Submit Answer</button>

      {feedback && <p style={styles.feedback}>{feedback}</p>}
    </div>
  );
}

// Some inline styling for quick reference
const styles = {
  container: {
    padding: '100px',
    maxWidth: '700px',
    margin: '50px 100px',
  },
  questionBlock: {
    marginBottom: '10px',
    fontSize: '1.1rem',
  },
  textarea: {
    width: '100%',
    marginTop: '10px',
  },
  feedback: {
    marginTop: '10px',
    fontWeight: 'bold',
  },
};

export default AdaptiveQuestionPage;
