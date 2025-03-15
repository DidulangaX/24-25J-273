// SkillForge\frontend\src\components\adaptive\ChallengeSessionPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ChallengeSessionPage.css';

function ChallengeSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [userId] = useState('User123'); // Replace with actual user ID from auth state
  const [answers, setAnswers] = useState({}); // question_id -> answer text
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [sessionStatus, setSessionStatus] = useState('pending');
  const [slideOut, setSlideOut] = useState(false);
  const [isNewQuestion, setIsNewQuestion] = useState(true);
  const pollIntervalRef = useRef(null);
  const confettiContainerRef = useRef(null);

  // Fetch session data on mount and set polling for session status
  useEffect(() => {
    fetchSession();
    pollIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, 5000);
    return () => clearInterval(pollIntervalRef.current);
  }, [sessionId]);

  // Countdown timer effect – update every second when session is active
  useEffect(() => {
    let countdown = null;
    if (sessionStatus === 'active' && timer > 0) {
      countdown = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    if (timer === 0 && sessionStatus === 'active') {
      // Time expired, navigate to results page
      navigate(`/challenge-results/${sessionId}`);
    }
    return () => clearInterval(countdown);
  }, [timer, sessionStatus, navigate, sessionId]);

  // Effect to handle animation for new questions
  useEffect(() => {
    if (isNewQuestion) {
      setTimeout(() => {
        setIsNewQuestion(false);
      }, 100);
    }
  }, [isNewQuestion, currentQuestionIndex]);

  // Fetch challenge session details from backend
  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch challenge session');
      }
      const data = await res.json();
      setSessionData(data);
      setSessionStatus(data.status);
      if (data.status === 'active' && data.endTime) {
        const endTime = new Date(data.endTime).getTime();
        const now = Date.now();
        setTimer(Math.max(0, Math.floor((endTime - now) / 1000)));
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error loading session');
    } finally {
      setLoading(false);
    }
  };

  // Poll the session status to detect when all participants have accepted or time expires
  const checkSessionStatus = async () => {
    try {
      const res = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionStatus(data.status);
        
        if (data.status === 'active' && data.endTime) {
          const endTime = new Date(data.endTime).getTime();
          const now = Date.now();
          setTimer(Math.max(0, Math.floor((endTime - now) / 1000)));
        }
        
        if (data.status === 'completed') {
          navigate(`/challenge-results/${sessionId}`);
          return;
        }
        
        // Check if all questions have been answered by the current user
        if (currentQuestionIndex >= sessionData.questions.length) {
          // Check if all participants have completed
          const submissionRes = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}/results`);
          
          if (submissionRes.ok) {
            const resultData = await submissionRes.json();
            
            // If the status is 'completed' or we got a successful result, navigate to results
            if (resultData.status === 'completed' || (resultData.result && resultData.result.winner)) {
              navigate(`/challenge-results/${sessionId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  // Create confetti effect when all questions are answered
  const createConfetti = () => {
    if (!confettiContainerRef.current) return;
    const container = confettiContainerRef.current;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${3 + Math.random() * 5}s`;
      confetti.style.animationDelay = `${Math.random()}s`;
      container.appendChild(confetti);
      
      // Remove confetti after animation ends
      setTimeout(() => {
        confetti.remove();
      }, 8000);
    }
  };

  // Handle answer submission for current question with slide-out animation
  const handleSubmitAnswer = async () => {
    if (!sessionData) return;
    const questions = sessionData.questions;
    if (!questions || questions.length === 0 || currentQuestionIndex >= questions.length) {
      alert('No question available.');
      return;
    }
    const currentQuestion = questions[currentQuestionIndex];
    const answerText = answers[currentQuestion.question_id] || '';
    if (!answerText.trim()) {
      alert('Answer cannot be empty.');
      return;
    }
    try {
      // Trigger slide-out animation
      setSlideOut(true);
      // Wait for animation duration (600ms as defined in CSS)
      await new Promise(resolve => setTimeout(resolve, 600));

      const payload = {
        participant: userId,
        question_id: currentQuestion.question_id,
        answer: answerText,
        timeTaken: 10 // Replace with actual time per question if needed
      };
      const res = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSlideOut(false);
      setIsNewQuestion(true);
      // Clear answer for the question that was just submitted
      setAnswers(prev => ({ ...prev, [currentQuestion.question_id]: '' }));
      
      // Check if this was the last question
      if (currentQuestionIndex === questions.length - 1) {
        setTimeout(() => {
          createConfetti();
          
          // Try to finalize the session when all questions are answered
          finalizeSession();
        }, 300);
      }
    } catch (error) {
      alert(error.message);
      setSlideOut(false);
    }
  };


  const finalizeSession = async () => {
    try {
      // Call the finalize endpoint
      const res = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}/results`);
      if (res.ok) {
        const data = await res.json();
        
        // If the challenge is completed, navigate to results
        if (data.status === 'completed' || (data.result && data.result.winner)) {
          navigate(`/challenge-results/${sessionId}`);
        } else {
          // Schedule periodic checks for completion
          const checkInterval = setInterval(async () => {
            const checkRes = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}/results`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.status === 'completed' || (checkData.result && checkData.result.winner)) {
                clearInterval(checkInterval);
                navigate(`/challenge-results/${sessionId}`);
              }
            }
          }, 3000); // Check every 3 seconds
          
          // Clear interval after 30 seconds max
          setTimeout(() => clearInterval(checkInterval), 30000);
        }
      }
    } catch (error) {
      console.error('Error finalizing session:', error);
    }
  };

  // Format timer with colors based on remaining time
  const getTimerClass = () => {
    if (timer < 30) return "timer danger";
    if (timer < 60) return "timer warning";
    return "timer";
  };

  // Format time to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="challenge-session-page container">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  if (errorMsg) {
    return (
      <div className="challenge-session-page container">
        <div className="alert alert-danger text-center p-4" role="alert">
          <h5>{errorMsg}</h5>
          <button className="btn btn-outline-secondary mt-3" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  if (!sessionData) {
    return (
      <div className="challenge-session-page container">
        <div className="alert alert-warning text-center p-4" role="alert">
          <h5>Session not found.</h5>
          <button className="btn btn-outline-secondary mt-3" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Determine if there are remaining questions
  const questions = sessionData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const questionsCount = questions.length;

  return (
    <div className="challenge-session-page container my-5">
      <div ref={confettiContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}></div>
      <div className="session-header mb-4">
        <h2>Challenge Session: {sessionData._id}</h2>
        <p>Difficulty: <span className="badge bg-info">{sessionData.difficulty || 'Standard'}</span></p>
        <p>
          Time Remaining: <span className={getTimerClass()}>{formatTime(timer)}</span>
        </p>
        {questionsCount > 0 && (
          <div className="progress-indicators">
            {Array.from({ length: questionsCount }).map((_, index) => (
              <div 
                key={index} 
                className={`progress-dot ${index <= currentQuestionIndex ? 'active' : ''}`}
                title={`Question ${index + 1}`}
              ></div>
            ))}
          </div>
        )}
      </div>
      {currentQuestion ? (
        <div className={`question-card card mb-4 ${slideOut ? 'slide-out' : ''}`}>
          <div className="card-header">
            <h5>Question #{currentQuestionIndex + 1} of {questionsCount}</h5>
          </div>
          <div className="card-body">
            <p><strong>Prompt:</strong> {currentQuestion.prompt}</p>
            <textarea
              className="form-control"
              rows="4"
              value={answers[currentQuestion.question_id] || ''}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentQuestion.question_id]: e.target.value
                }))
              }
              placeholder="Type your answer here..."
            />
            <button className="btn btn-primary mt-2" onClick={handleSubmitAnswer}>
              Submit Answer
            </button>
          </div>
        </div>
      ) : (
        <div className="complete-message">
          <h4>You have answered all questions!</h4>
          <p>Great job completing this challenge session.</p>
          <button className="btn btn-success" onClick={() => navigate(`/challenge-results/${sessionId}`)}>
            View Results
          </button>
        </div>
      )}
    </div>
  );
}

export default ChallengeSessionPage;