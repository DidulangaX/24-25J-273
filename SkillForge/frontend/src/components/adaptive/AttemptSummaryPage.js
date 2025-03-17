// AttemptSummaryPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FinalSummaryBanner from "./FinalSummaryBanner";
import "./AttemptSummaryPage.css";

function AttemptSummaryPage({ userId }) {
  const { attemptNumber } = useParams();
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId && attemptNumber) {
      fetchSummary();
    }
    // eslint-disable-next-line
  }, [userId, attemptNumber]);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const url = `http://localhost:8051/api/adaptive/finalSummary?user_id=${userId}&attemptNumber=${attemptNumber}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        setMessage(data.error);
      } else if (data.message && data.phase !== "finished") {
        // If the session isn't finished yet, display the message.
        setMessage(data.message);
      } else {
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      setMessage("Error fetching summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/myAttempts");
  };

  if (isLoading) {
    return (
      <div className="attempt-summary-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="attempt-summary-container">
        <div className="message-box">
          <h2>Attempt Summary</h2>
          <p className="error-message">{message}</p>
          <button onClick={handleBack} className="back-button">
            <span className="button-icon">←</span> Back to My Attempts
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null; // Should never reach here since we handle loading state above
  }

  // Calculate topic mastery percentage for visual representation
  const getMasteryLevel = (value) => {
    if (value >= 0.8) return "excellent";
    if (value >= 0.6) return "good";
    if (value >= 0.4) return "fair";
    return "needs-work";
  };

  // Get overall mastery percentage across all topics
  const averageMastery =
    Object.values(summary.topic_mastery).reduce((a, b) => a + b, 0) /
    Object.values(summary.topic_mastery).length;

  return (
    <div className="attempt-summary-container">
      {/* Final Summary Banner */}
      <FinalSummaryBanner
        userName={userId}
        attemptNumber={summary.attemptNumber}
        totalScore={summary.total_score}
        badge={summary.badge}
      />

      {/* Score Overview */}
      <div className="score-overview">
        <div className="score-overview-card">
          <span className="score-value">{summary.total_score}</span>
          <span className="score-label">Total Score</span>
        </div>
        <div className="score-overview-card">
          <span className="score-value">
            {(averageMastery * 100).toFixed(0)}%
          </span>
          <span className="score-label">Overall Mastery</span>
        </div>
        <div className="score-overview-card">
          <span className="score-value">{summary.rounds.length}</span>
          <span className="score-label">Rounds Completed</span>
        </div>
      </div>

      {/* Rounds Overview Section */}
      <div className="summary-section rounds-section">
        <h3 className="section-title">
          <span className="icon">📊</span> Rounds Overview
        </h3>
        <div className="table-container">
          <table className="summary-table rounds-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Correct Answers</th>
                <th>Total Questions</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {summary.rounds.map((r) => {
                const percentage = (r.correctCount / r.totalQuestions) * 100;
                const performanceClass =
                  percentage >= 80
                    ? "excellent"
                    : percentage >= 60
                    ? "good"
                    : percentage >= 40
                    ? "fair"
                    : "needs-work";

                return (
                  <tr key={r.roundNumber} className="round-row">
                    <td className="round-number">{r.roundNumber}</td>
                    <td className="correct-count">{r.correctCount}</td>
                    <td className="total-questions">{r.totalQuestions}</td>
                    <td className="performance">
                      <div className="progress-container">
                        <div
                          className={`progress-bar ${performanceClass}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <span className="progress-text">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topic Mastery Section */}
      <div className="summary-section mastery-section">
        <h3 className="section-title">
          <span className="icon">🎯</span> Topic Mastery
        </h3>
        <div className="mastery-grid">
          {Object.entries(summary.topic_mastery).map(([topic, val]) => {
            const masteryLevel = getMasteryLevel(val);
            const percentage = (val * 100).toFixed(0);

            return (
              <div key={topic} className={`mastery-card ${masteryLevel}`}>
                <div className="topic-name">{topic}</div>
                <div className="mastery-meter">
                  <div
                    className="mastery-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="mastery-value">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="summary-section recommendation-section">
        <h3 className="section-title">
          <span className="icon">💡</span> Recommendations
        </h3>
        <div className="recommendation-content">
          <p>Based on your performance, consider focusing on these areas:</p>
          <ul className="recommendation-list">
            {Object.entries(summary.topic_mastery)
              .sort((a, b) => a[1] - b[1])
              .slice(0, 2)
              .map(([topic, val]) => (
                <li key={topic}>
                  Review <strong>{topic}</strong> concepts to improve your
                  mastery (currently at {(val * 100).toFixed(0)}%)
                </li>
              ))}
            <li>Try another attempt to test your knowledge retention</li>
          </ul>
        </div>
      </div>

      <button onClick={handleBack} className="back-button main-back-button">
        <span className="button-icon">←</span> Back to My Attempts
      </button>
    </div>
  );
}

export default AttemptSummaryPage;
