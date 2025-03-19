// File: src/components/adaptive/MyAttemptsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyAttemptsPage.css';

function MyAttemptsPage({ userId }) {
  const [attempts, setAttempts] = useState([]);
  const [message, setMessage] = useState('');
  const [activeAttemptNumber, setActiveAttemptNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchAttempts();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchAttempts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8051/api/adaptive/allAttempts?user_id=${userId}`
      );
      const data = await response.json();

      // The backend returns an object like: { status: 'success', attempts: [...] }
      if (data.status === 'success' && Array.isArray(data.attempts)) {
        setAttempts(data.attempts);

        // Check if there's an active/in_progress attempt
        const activeAttempt = data.attempts.find(
          (a) => a.phase === 'active' || a.phase === 'in_progress'
        );
        if (activeAttempt) {
          setActiveAttemptNumber(activeAttempt.attemptNumber);
        }
      } else {
        setMessage(data.error || data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching attempts:', err);
      setMessage('Error fetching attempts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAttempt = async () => {
    try {
      setMessage('Creating new attempt...');
      const res = await fetch('http://localhost:8051/api/adaptive/newAttempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.session_id && data.attemptNumber) {
        setActiveAttemptNumber(data.attemptNumber);
        navigate('/questions', { state: { attemptNumber: data.attemptNumber } });
      } else {
        setMessage(data.error || data.message || 'Failed to create new attempt.');
      }
    } catch (error) {
      console.error('Error creating new attempt:', error);
      setMessage('Error creating new attempt.');
    }
  };

  const handleGoToQuestions = () => {
    if (activeAttemptNumber) {
      navigate('/questions', { state: { attemptNumber: activeAttemptNumber } });
    } else {
      navigate('/questions');
    }
  };

  const handleViewSummary = (attemptNumber) => {
    navigate(`/summary/${attemptNumber}`);
  };

  // Get badge icon based on badge name
  const getBadgeIcon = (badge) => {
    if (!badge) return '🔄';
    switch (badge.toLowerCase()) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '💎';
      default: return '🏆';
    }
  };

  // Get status indicator class based on phase
  const getStatusClass = (phase) => {
    switch (phase) {
      case 'active':
      case 'in_progress':
        return 'status-active';
      case 'completed':
      case 'finished':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="my-attempts-container">
      <div className="attempts-header">
        <h1 className="attempts-title">My Learning Attempts</h1>
        <p className="attempts-subtitle">
          Track your progress and review past learning sessions
        </p>
      </div>

      <div className="attempts-controls">
        <button onClick={handleNewAttempt} className="attempt-button new-attempt">
          <span className="button-icon">➕</span>
          Start New Attempt
        </button>

        {activeAttemptNumber && (
          <button onClick={handleGoToQuestions} className="attempt-button continue-attempt">
            <span className="button-icon">▶️</span>
            Continue Active Attempt
          </button>
        )}
      </div>

      {message && <div className="attempts-message">{message}</div>}

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your attempts...</p>
        </div>
      ) : attempts && attempts.length > 0 ? (
        <div className="attempts-list-container">
          <div className="attempts-count">
            <span className="count-number">{attempts.length}</span>
            <span className="count-label">Total Attempts</span>
          </div>

          <div className="attempts-table-container">
            <table className="attempts-table">
              <thead>
                <tr>
                  <th>Attempt #</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Badge</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => {
                  const date = new Date(attempt.createdAt);
                  const formattedDate = date.toLocaleDateString();
                  const formattedTime = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={attempt.attemptNumber}
                      className={attempt.phase === 'active' ? 'active-row' : ''}
                    >
                      <td className="attempt-number">{attempt.attemptNumber}</td>
                      <td>
                        <span className={`status-indicator ${getStatusClass(attempt.phase)}`}>
                          {attempt.phase === 'active'
                            ? 'In Progress'
                            : attempt.phase === 'finished'
                            ? 'Completed'
                            : attempt.phase.charAt(0).toUpperCase() +
                              attempt.phase.slice(1)}
                        </span>
                      </td>
                      <td className="attempt-score">{attempt.total_score || '-'}</td>
                      <td className="attempt-badge">
                        <span className="badge-icon">{getBadgeIcon(attempt.badge)}</span>
                        <span className="badge-name">{attempt.badge || 'Pending'}</span>
                      </td>
                      <td className="attempt-date">
                        <div className="date-display">
                          <span className="date-day">{formattedDate}</span>
                          <span className="date-time">{formattedTime}</span>
                        </div>
                      </td>
                      <td className="attempt-actions">
                        {attempt.phase === 'active' ? (
                          <button
                            onClick={() =>
                              navigate('/questions', {
                                state: { attemptNumber: attempt.attemptNumber },
                              })
                            }
                            className="action-button continue"
                          >
                            Continue
                          </button>
                        ) : attempt.phase === 'finished' ? (
                          <button
                            onClick={() => handleViewSummary(attempt.attemptNumber)}
                            className="action-button view"
                          >
                            View Results
                          </button>
                        ) : (
                          <span className="action-pending">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-attempts">
          <div className="no-attempts-icon">📚</div>
          <h3>No Attempts Yet</h3>
          <p>Start your first learning attempt to begin tracking your progress!</p>
          <button onClick={handleNewAttempt} className="attempt-button new-attempt-large">
            Start First Attempt
          </button>
        </div>
      )}
    </div>
  );
}

export default MyAttemptsPage;
