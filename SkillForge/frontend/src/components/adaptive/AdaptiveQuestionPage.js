// File: src/components/adaptive/AdaptiveQuestionPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RoundSummary from "./RoundSummary"; // <-- import the new component
import "./AdaptiveQuestionPage.css";

function AdaptiveQuestionPage({ userId }) {
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("neutral"); // success/error/neutral
  const [loading, setLoading] = useState(false);

  // NEW: hold the round summary in state if the round completes
  const [roundSummary, setRoundSummary] = useState(null);
  // If final challenge is done, we might store a "challengeComplete" boolean or final summary.

  const navigate = useNavigate();
  const location = useLocation();
  const [attemptNumber] = useState(location.state?.attemptNumber || null);

  useEffect(() => {
    if (userId) {
      fetchCurrentQuestion();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchCurrentQuestion = async () => {
    setLoading(true);
    setRoundSummary(null); // Clear any prior summary, in case we're continuing
    setFeedback("");
    try {
      const response = await fetch(
        `http://localhost:8051/api/adaptive/currentQuestion?user_id=${userId}`
      );
      const data = await response.json();

      if (data.status === "no_active_session") {
        // no active session => user must start new attempt or is finished
        setQuestion(null);
        setFeedback(data.message || "No active session");
        setFeedbackType("neutral");
      } 
      else if (data.status === "finished") {
        // The user is done with all rounds
        setQuestion(null);
        setFeedback("Session is already finished.");
        setFeedbackType("neutral");
        // optionally navigate to final summary
        if (attemptNumber) {
          navigate(`/attemptSummary/${attemptNumber}`);
        }
      }
      else if (data.status === "round_completed") {
        // The backend says the round is already completed => it also returns summary
        if (data.summary) {
          setRoundSummary(data.summary);
        }
        setQuestion(null);
        setFeedbackType("neutral");
      }
      else if (data.status === "question") {
        // We have an active question
        setQuestion(data);
        setFeedback("");
      }
      else {
        // fallback
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

      // Show classification feedback
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

      // Check the "status" the backend sends
      if (data.status === "time_limit_exceeded") {
        // Round automatically completed, so we'll just fetch next
        setQuestion(null);
        setFeedback(data.message || "Time limit exceeded.");
        setFeedbackType("neutral");
        // Possibly the backend calls moveToNextPhase => we can refetch
        fetchCurrentQuestion();
      }
      else if (data.status === "round_complete") {
        // The round just ended. The response includes a "summary" object
        if (data.summary) {
          setRoundSummary(data.summary);
        }
        setQuestion(null);
        setFeedback(data.message || "Round complete");
        setFeedbackType("neutral");
      }
      else if (data.status === "challenge_complete") {
        // All 3 rounds are done
        setQuestion(null);
        setFeedback(data.message || "Challenge complete!");
        setFeedbackType("success");
        // Optionally navigate to final summary
        if (attemptNumber) {
          navigate(`/attemptSummary/${attemptNumber}`, {
            state: { finalData: data },
          });
        } else {
          navigate("/myAttempts");
        }
      }
      else if (data.status === "answer_submitted") {
        // user answered a question, we might have "next_question"
        if (data.next_question && data.next_question.question_id) {
          setQuestion(data.next_question);
        } else {
          // no more questions => possibly fetchCurrentQuestion again
          fetchCurrentQuestion();
        }
      }
      else {
        // fallback
        // e.g. data.status might be something else
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

  // -------------- HANDLERS for RoundSummary --------------
  const handleContinue = () => {
    // The user passed => proceed to the next round by calling fetchCurrentQuestion again
    setRoundSummary(null);
    fetchCurrentQuestion();
  };

  const handleRetry = () => {
    // The user failed => same logic, call fetchCurrentQuestion 
    // (the backend will create a new attempt for the same round)
    setRoundSummary(null);
    fetchCurrentQuestion();
  };

  // -------------- RENDERING LOGIC --------------
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

  // 1) If we have a round summary to show, display it instead of question form
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

  // 2) If no question is available (e.g., session finished or error)
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
                navigate(`/attemptSummary/${attemptNumber}`);
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

  // 3) Otherwise, show the active question
  return (
    <div className="adaptive-question-container">
      <div className="question-header">
        <h1 className="question-title">Adaptive Learning</h1>
        <p className="question-subtitle">
          Answer the questions to complete your assessment
        </p>
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
  );6
}

export default AdaptiveQuestionPage;
