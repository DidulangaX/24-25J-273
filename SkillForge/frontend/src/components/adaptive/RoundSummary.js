import React from 'react';
import './RoundSummary.css'; // optional styling file

const RoundSummary = ({ summary, onContinue, onRetry }) => {
  if (!summary) return <div>Loading summary...</div>;

  const {
    roundNumber,
    score,
    correctAnswers,
    totalQuestions,
    timeSpent,
    passed,
    topicPerformance = {},
    difficultyPerformance = {},
    // minPassingScore is optional if your backend includes it
    // or you can just do 60% default
    minPassingScore = 60 
  } = summary;

  // Convert topic/difficulty performance Maps to arrays
  const topicPerfArray = Object.entries(topicPerformance).map(([topic, stats]) => ({
    topic,
    ...stats
  }));
  const diffPerfArray = Object.entries(difficultyPerformance).map(([diff, stats]) => ({
    difficulty: diff,
    ...stats
  }));

  // Sort topic performance by ascending correctness (weakest first)
  const sortedTopics = topicPerfArray.sort((a, b) => a.percentage - b.percentage);

  // Time formatting
  const minutes = Math.floor(timeSpent / 60);
  const seconds = Math.floor(timeSpent % 60);
  const timeDisplay = `${minutes}m ${seconds < 10 ? '0' + seconds : seconds}s`;

  return (
    <div className="round-summary-container">
      {passed ? (
        <div className="success-banner">
          <h2>🎉 Congratulations! 🎉</h2>
          <p>You passed Round {roundNumber}.</p>
        </div>
      ) : (
        <div className="failure-banner">
          <h2>Round {roundNumber} Completed</h2>
          <p>
            Unfortunately, you did not reach the passing score. You must retry this round to move forward.
          </p>
        </div>
      )}

      <div className="summary-core">
        <h3>Round {roundNumber} Summary</h3>
        <div className="summary-score-row">
          <div className="score-circle">
            <span className="score-value">{Math.round(score)}%</span>
          </div>
          <div className="score-info">
            <p><strong>Correct Answers:</strong> {correctAnswers} / {totalQuestions}</p>
            <p><strong>Time Spent:</strong> {timeDisplay}</p>
            <p><strong>Passing Score:</strong> {minPassingScore}%</p>
            <p><strong>Status:</strong> {passed ? 'Passed' : 'Failed'}</p>
          </div>
        </div>
      </div>

      <div className="performance-section">
        <h4>Topic Performance</h4>
        {sortedTopics.map((tp) => (
          <div key={tp.topic} className="performance-bar-row">
            <div className="performance-label">{tp.topic}</div>
            <div className="performance-bar">
              <div
                className="performance-fill"
                style={{ width: `${tp.percentage.toFixed(0)}%` }}
              />
            </div>
            <div className="performance-percentage">
              {tp.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      <div className="performance-section">
        <h4>Difficulty Performance</h4>
        {diffPerfArray.map((dp) => (
          <div key={dp.difficulty} className="performance-bar-row">
            <div className="performance-label">{dp.difficulty}</div>
            <div className="performance-bar">
              <div
                className="performance-fill"
                style={{ width: `${dp.percentage.toFixed(0)}%` }}
              />
            </div>
            <div className="performance-percentage">
              {dp.percentage.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      <div className="summary-actions">
        {passed ? (
          <button className="continue-button" onClick={onContinue}>
            Continue to Next Round
          </button>
        ) : (
          <button className="retry-button" onClick={onRetry}>
            Retry Round
          </button>
        )}
      </div>
    </div>
  );
};

export default RoundSummary;
