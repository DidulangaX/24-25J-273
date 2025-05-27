// File: src/components/adaptive/AdaptiveQuestionPage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RoundSummary from "./RoundSummary";
import "./AdaptiveQuestionPage.css";

function AdaptiveQuestionPage({ userId }) {
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("neutral"); // success/error/neutral
  const [loading, setLoading] = useState(false);
  const [showHelpOffer, setShowHelpOffer] = useState(false);
  const [currentHelp, setCurrentHelp] = useState(null);
  const [helpContent, setHelpContent] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [bonusTime, setBonusTime] = useState(0);
  const [bonusAnim, setBonusAnim] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [roundSummary, setRoundSummary] = useState(null);

  const timerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [attemptNumber] = useState(location.state?.attemptNumber || null);

  useEffect(() => {
    if (userId) {
      fetchCurrentQuestion();
    }
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
    if (question?.timeRemaining) {
      setInitialTime(question.timeRemaining);
      setTimeRemaining(question.timeRemaining);
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [question]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeExpired = async () => {
    setFeedback("Time's up! Submitting automatically...");
    await handleSubmitAnswer();
  };

  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setRoundSummary(null); // Clear any prior summary
    setFeedback("");
    try {
      const response = await fetch(
        `http://localhost:8051/api/adaptive/currentQuestion?user_id=${userId}`
      );
      const data = await response.json();

      if (data.status === "no_active_session") {
        setQuestion(null);
        setFeedback(data.message || "No active session");
        setFeedbackType("neutral");
      } if (data.status === "finished") {
  navigate(`/attemptSummary/${attemptNumber}`, {
    state: { 
      finalData: {
        finalSummary: data
      }
    }
  });
} else if (data.status === "round_completed") {
        if (data.summary) {
          setRoundSummary(data.summary);
        }
        setQuestion(null);
        setFeedback(data.message || "Round complete");
        setFeedbackType("neutral");
      } else if (data.status === "question") {
        setQuestion(data);
        setFeedback("");
      } else {
        setQuestion(null);
        setFeedback(data.message || "Unknown status from server.");
        setFeedbackType("neutral");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      setFeedback("Error fetching question.");
      setFeedbackType("error");
    }
    setLoading(false);
  };

const handleSkipRound = async () => {
  setLoading(true);
  try {
    const resp = await fetch('http://localhost:8051/api/adaptive/skipRound', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ user_id: userId })
    });
    const data = await resp.json();
    /* handle data.status === 'round_skipped' or 'session_complete' */
  } catch (e) {
    console.error(e);
    setFeedback('Error skipping round'); setFeedbackType('error');
  }
  setLoading(false);
};

  const handleSubmitAnswer = async () => {
    if (!question) {
      setFeedback("No question is currently active.");
      setFeedbackType("error");
      return;
    }

    setLoading(true);
    const payload = {
      user_id: userId,
      question_id: question.question_id,
      user_answer: userAnswer,
    };

    try {
      const response = await fetch("http://localhost:8051/api/adaptive/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.bonusTime) {
        setBonusTime(data.bonusTime);
        setBonusAnim(true);
        setTimeRemaining((prev) => prev + data.bonusTime);
        setTimeout(() => {
          setBonusAnim(false);
          setBonusTime(0);
        }, 1200);
      }

      // in handleSubmitAnswer response
if (data.next_question && !data.next_question.startTime) {
  data.next_question.startTime = Date.now();  // fallback
}


      if (data.help?.offered) {
        setShowHelpOffer(true);
        setCurrentHelp(data.help);
      }

      if (data.classification) {
        setFeedback(`Classification: ${data.classification}`);
        const classification = data.classification.toLowerCase();
        setFeedbackType(
          classification.includes("correct")
            ? "success"
            : classification.includes("incorrect")
            ? "error"
            : "neutral"
        );
      }

      if (data.status === "time_limit_exceeded") {
        setQuestion(null);
        setFeedback(data.message || "Time limit exceeded.");
        setFeedbackType("neutral");
        fetchCurrentQuestion();
      } 
      
      else if (data.status === "finished") {
  // Directly navigate to summary if session finished
  navigate(`/attemptSummary/${attemptNumber}`, {
    state: { 
      finalData: {
        finalSummary: data.finalSummary || data
      }
    }
  });
}


      else if (data.status === "round_complete") {
        // Display the round summary
        if (data.summary) {
          setRoundSummary(data.summary);
        }
        setQuestion(null);
        setFeedback(data.message || "Round complete");

        // If the user passed and there's a next question, automatically proceed
        if (data.passed && data.next_question && data.next_question.question_id) {
          setTimeout(() => {
            setRoundSummary(null); // Clear summary to show question
            setQuestion(data.next_question);
            setFeedback("");
            setFeedbackType("neutral");
          }, 2000); // Brief delay to show summary before transitioning
        } else if (data.status === "session_complete") {
  // Navigate to final summary with full data
  navigate(`/attemptSummary/${attemptNumber}`, {
    state: { 
      finalData: {
        finalSummary: data.finalSummary || data // Use finalSummary if available
      } 
    }
  });
}
      } else if (data.status === "answer_submitted") {
        if (data.next_question && data.next_question.question_id) {
          setQuestion(data.next_question);
        } else {
          fetchCurrentQuestion();
        }
      } else {
        if (data.next_question && data.next_question.question_id) {
          setQuestion(data.next_question);
        } else {
          setQuestion(null);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedback("Error submitting answer.");
      setFeedbackType("error");
    }
    setUserAnswer("");
    setLoading(false);
  };

  const handleAcceptHelp = async () => {
    try {
      const response = await fetch("http://localhost:8051/api/adaptive/help/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          feedbackId: currentHelp.feedbackId,
        }),
      });

      const helpData = await response.json();
      setHelpContent(helpData.feedback);
      setShowHelpOffer(false);
    } catch (error) {
      console.error("Error accepting help:", error);
      setFeedback("Error loading help content");
      setFeedbackType("error");
      setShowHelpOffer(false);
    }
  };

  const handleContinue = () => {
    setRoundSummary(null);
    fetchCurrentQuestion();
  };

  const handleRetry = () => {
    setRoundSummary(null);
    fetchCurrentQuestion();
  };

  // Rendering logic
  if (showHelpOffer) {
    return (
      <div className="adaptive-question-container">
        <div className="help-offer-card">
          <div className="help-header">
            <span className="help-icon">🆘</span>
            <h2>Need Some Help?</h2>
          </div>
          <p className="help-message">{currentHelp?.message}</p>
          <div className="help-button-group">
            <button onClick={handleAcceptHelp} className="help-accept-button">
              Yes, Help Me
            </button>
            <button
              onClick={() => setShowHelpOffer(false)}
              className="help-dismiss-button"
            >
              I'll Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (helpContent) {
    return (
      <div className="adaptive-question-container">
        <div className="help-content-card">
          <div className="help-content-header">
            <h2>Help with {helpContent.topic}</h2>
            <button
              className="close-help-button"
              onClick={() => setHelpContent(null)}
            >
              ×
            </button>
          </div>
          <div className="help-section">
            <h3>Explanation</h3>
            <p className="help-feedback">{helpContent.feedback}</p>
          </div>
          <div className="help-section">
            <h3>Correct Example</h3>
            <pre className="help-code">{helpContent.codeExample}</pre>
          </div>
          <div className="help-section">
            <h3>Improvement Tips</h3>
            <ul className="help-tips">
              {helpContent.tips.map((tip, index) => (
                <li key={index} className="help-tip">
                  <span className="tip-number">0{index + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <button
            className="back-to-question-button"
            onClick={() => {
              setHelpContent(null);
              fetchCurrentQuestion();
            }}
          >
            Back to Questions
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="adaptive-question-container">
        <div className="question-header">
          <h1 className="question-title">Adaptive Learning</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (roundSummary) {
    return (
      <div className="adaptive-question-container">
        <RoundSummary
          summary={roundSummary}
          onContinue={handleContinue}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="adaptive-question-container">
        <div className="question-header">
          <h1 className="question-title">Adaptive Learning</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-message">
            {feedback || "No question available at the moment."}
          </p>
          <button
  onClick={() => {
    if (attemptNumber) {
      navigate(`/attemptSummary/${attemptNumber}`, {
        state: { finalData: location.state?.finalData }
      });
    } else {
      navigate("/myAttempts");
    }
  }}
  className="summary-button"
>
            Go to My Attempts / Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="adaptive-question-container">
      <div className="question-header">
        <div className="header-content">
          <div className="title-container">
            <h1 className="question-title">Adaptive Learning</h1>
            <p className="question-subtitle">
              Answer the questions to complete your assessment
            </p>
          </div>
          <div className="timer-container">
            <div className="timer-progress">
              <svg className="timer-svg" viewBox="0 0 100 100">
                <circle className="timer-base" cx="50" cy="50" r="45" />
                <circle
                  className={`timer-progress ${bonusAnim ? "bonus-ring" : ""}`}
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDashoffset:
                      283 - (283 * (timeRemaining / initialTime) * 100) / 100,
                  }}
                />
              </svg>
              <div className="timer-text">
                {String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:
                {String(timeRemaining % 60).padStart(2, "0")}
              </div>
            </div>
            {bonusTime > 0 && <div className="time-bonus">+{bonusTime}s Bonus!</div>}
          </div>
        </div>
      </div>

      <div className="question-block">
        <span className="prompt-label">Question Prompt</span>
        <p className="question-prompt">{question.prompt}</p>
      </div>

      <div className="answer-area">
        <textarea
          className="answer-textarea"
          rows={8}
          placeholder="Type your code or answer here..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
        />
      </div>
      <button
  onClick={handleSkipRound}
  className="skip-button"
>
  Skip Round
</button>


      <button
        onClick={handleSubmitAnswer}
        className="submit-button"
        disabled={!userAnswer.trim()}
      >
        Submit Answer
      </button>

      {feedback && (
        <div className={`feedback feedback-${feedbackType}`}>{feedback}</div>
      )}
    </div>
  );
}

export default AdaptiveQuestionPage;