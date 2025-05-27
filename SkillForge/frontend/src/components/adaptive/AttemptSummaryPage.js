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
        // Extract the nested summary object
        setSummary(data.summary);
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
  const masteryValues = summary.topic_mastery
    ? Object.values(summary.topic_mastery)
    : [];
  const averageMastery =
    masteryValues.length > 0
      ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length
      : 0;

  // ---------------------------
  // DEDUPLICATE ROUND SUMMARIES
  // ---------------------------
  // We only want the *latest* summary for each roundNumber
  const { roundSummaries = [] } = summary;
  const uniqueSummaries = [];
  const seenRounds = new Set();

  // Iterate from the end so we keep the most recent attempt for each round
  for (let i = roundSummaries.length - 1; i >= 0; i--) {
    const s = roundSummaries[i];
    if (!seenRounds.has(s.roundNumber)) {
      // Insert at front so the final array is in ascending order
      uniqueSummaries.unshift(s);
      seenRounds.add(s.roundNumber);
    }
  }

  // Helper function to render AI Analysis sections
  const renderAIAnalysis = () => {
    const { aiAnalysis } = summary;
    
    if (!aiAnalysis || aiAnalysis.error) {
      return (
        <div className="ai-analysis-error">
          <p>AI analysis is currently unavailable.</p>
          {aiAnalysis?.error && (
            <small>Error: {aiAnalysis.error}</small>
          )}
        </div>
      );
    }

    return (
      <div className="ai-analysis-container">
        {/* Overview Section */}
        {aiAnalysis.overview && (
          <div className="analysis-section overview-section">
            <h4 className="analysis-title">
              <span className="icon">📋</span> Performance Overview
            </h4>
            <p className="overview-text">{aiAnalysis.overview}</p>
          </div>
        )}

        {/* Strengths and Weaknesses Grid */}
        <div className="strengths-weaknesses-grid">
          {/* Strengths */}
          {aiAnalysis.strength && aiAnalysis.strength.length > 0 && (
            <div className="analysis-section strengths-section">
              <h4 className="analysis-title">
                <span className="icon">✅</span> Your Strengths
              </h4>
              <ul className="strengths-list">
                {aiAnalysis.strength.map((strength, index) => (
                  <li key={index} className="strength-item">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {aiAnalysis.weakness && aiAnalysis.weakness.length > 0 && (
            <div className="analysis-section weaknesses-section">
              <h4 className="analysis-title">
                <span className="icon">⚠️</span> Areas for Improvement
              </h4>
              {aiAnalysis.weakness.map((weakness, index) => (
                <div key={index} className="weakness-card">
                  <h5 className="weakness-topic">{weakness.topic}</h5>
                  {weakness.issues && weakness.issues.length > 0 && (
                    <ul className="weakness-issues">
                      {weakness.issues.map((issue, issueIndex) => (
                        <li key={issueIndex} className="weakness-issue">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Study Plan */}
        {aiAnalysis.studyPlan && aiAnalysis.studyPlan.length > 0 && (
          <div className="analysis-section study-plan-section">
            <h4 className="analysis-title">
              <span className="icon">📚</span> Recommended Study Plan
            </h4>
            <div className="study-plan-grid">
              {aiAnalysis.studyPlan.map((item, index) => (
                <div key={index} className="study-plan-item">
                  <span className="step-number">{index + 1}</span>
                  <span className="step-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Suggestions */}
        {aiAnalysis.practiceSuggestions && aiAnalysis.practiceSuggestions.length > 0 && (
          <div className="analysis-section practice-section">
            <h4 className="analysis-title">
              <span className="icon">🎯</span> Practice Suggestions
            </h4>
            <div className="practice-suggestions">
              {aiAnalysis.practiceSuggestions.map((suggestion, index) => (
                <div key={index} className="practice-item">
                  <span className="practice-icon">🔧</span>
                  <span className="practice-text">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Resources */}
        {aiAnalysis.recommendedResources && aiAnalysis.recommendedResources.length > 0 && (
          <div className="analysis-section resources-section">
            <h4 className="analysis-title">
              <span className="icon">🔗</span> Recommended Resources
            </h4>
            <div className="resources-list">
              {aiAnalysis.recommendedResources.map((resource, index) => (
                <a
                  key={index}
                  href={resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-link"
                >
                  <span className="resource-icon">🌐</span>
                  <span className="resource-text">{resource}</span>
                  <span className="external-icon">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <span className="score-value">
            {uniqueSummaries.length}
          </span>
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
              {uniqueSummaries.map((r) => {
                const percentage = (r.correctAnswers / r.totalQuestions) * 100;
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
                    <td className="correct-count">{r.correctAnswers}</td>
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
          {summary.topic_mastery &&
            Object.entries(summary.topic_mastery).map(([topic, val]) => {
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

      {/* AI Analysis & Recommendations Section */}
      <div className="summary-section ai-recommendations-section">
        <h3 className="section-title">
          <span className="icon">🤖</span> AI-Powered Learning Insights
        </h3>
        {renderAIAnalysis()}
      </div>

      <button onClick={handleBack} className="back-button main-back-button">
        <span className="button-icon">←</span> Back to My Attempts
      </button>
    </div>
  );
}

export default AttemptSummaryPage;