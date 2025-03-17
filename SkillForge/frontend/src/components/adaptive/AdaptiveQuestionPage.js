// File: src/components/adaptive/AdaptiveQuestionPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdaptiveQuestionPage.css";

function AdaptiveQuestionPage({ userId }) {
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("neutral"); // neutral, success, error
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract attemptNumber from location.state (if present)
  const [attemptNumber] = useState(location.state?.attemptNumber || null);

  useEffect(() => {
    if (userId) {
      fetchCurrentQuestion();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchCurrentQuestion = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8051/api/adaptive/currentQuestion?user_id=${userId}`
      );
      const data = await response.json();
      if (data.message) {
        // Could be "Session is finished." or "No active session."
        setQuestion(null);
        setFeedback(data.message);
        setFeedbackType("neutral");
      } else if (data.question_id) {
        setQuestion(data);
        setFeedback("");
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      setFeedback("Error fetching question.");
      setFeedbackType("error");
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
      const response = await fetch(
        "http://localhost:8051/api/adaptive/answer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (data.classification) {
        const classification = data.classification.toLowerCase();
        setFeedback(`Classification: ${data.classification}`);
        setFeedbackType(
          classification.includes("correct")
            ? "success"
            : classification.includes("incorrect")
            ? "error"
            : "neutral"
        );
      }

      // if there's a next question
      if (data.next_question && data.next_question.question_id) {
        setQuestion(data.next_question);
        setUserAnswer("");
      }
      // if the server says no further questions or session finished
      else if (data.next_question && data.next_question.message) {
        setQuestion(null);
        setFeedback(data.next_question.message);
        setFeedbackType("neutral");

        // If the message indicates "Session is finished", auto-navigate to final summary
        if (data.next_question.message.toLowerCase().includes("finished")) {
          // If we don't know attemptNumber, we can just go to /myAttempts
          // But if we have attemptNumber, we can direct user to final summary
          if (attemptNumber) {
            navigate(`/attemptSummary/${attemptNumber}`);
          } else {
            navigate("/myAttempts");
          }
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setFeedback("Error submitting answer.");
      setFeedbackType("error");
    }

    setLoading(false);
  };

  const handleViewSummary = () => {
    // fallback button: user manually goes to MyAttempts
    // or attemptNumber => final summary
    if (attemptNumber) {
      navigate(`/attemptSummary/${attemptNumber}`);
    } else {
      navigate("/myAttempts");
    }
  };

  if (loading) {
    return (
      <div className="adaptive-question-container">
        <div className="question-header">
          <h1 className="question-title">Adaptive Learning</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your question...</p>
        </div>
      </div>
    );
  }

  // if no question is currently available or session is done
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
          <button onClick={handleViewSummary} className="summary-button">
            Go to My Attempts / Summary
          </button>
        </div>
      </div>
    );
  }

  // otherwise, display the question prompt
  return (
    <div className="adaptive-question-container">
      <div className="question-header">
        <h1 className="question-title">Adaptive Learning</h1>
        <p className="question-subtitle">
          Answer the questions to complete your assessment
        </p>
      </div>

      {/* Optional Progress Bar - Uncomment if you track progress */}
      {/*
      <div className="progress-container">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: '40%' }}></div>
        </div>
        <div className="progress-info">
          <span>Question 4 of 10</span>
          <span>40% Complete</span>
        </div>
      </div>
      */}

      <div className="question-block">
        {/* Optional Difficulty Badge - Uncomment if you want to show difficulty */}
        {/*
        <span className="difficulty-badge difficulty-medium">Medium</span>
        */}
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
