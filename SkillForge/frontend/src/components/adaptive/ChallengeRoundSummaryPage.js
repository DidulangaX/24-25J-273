// SkillForge/frontend/src/components/adaptive/ChallengeRoundSummaryPage.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ChallengeRoundSummaryPage() {
  // Get query parameters: user_id and roundNumber must be passed in the URL query string
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('user_id');
  const roundNumber = searchParams.get('roundNumber');

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!userId || !roundNumber) {
      setErrorMsg('Missing required parameters.');
      setLoading(false);
      return;
    }
    fetchRoundSummary();
    // eslint-disable-next-line
  }, [userId, roundNumber]);

  const fetchRoundSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8051/api/adaptive/round-summary?user_id=${userId}&roundNumber=${roundNumber}`);
      if (!res.ok) {
        throw new Error('Failed to fetch round summary.');
      }
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      setErrorMsg(error.message || 'Error fetching round summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container my-5">
      {loading && (
        <div className="text-center mt-5">
          <h4>Loading round summary...</h4>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-danger text-center" role="alert">
          {errorMsg}
        </div>
      )}
      {summary && (
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0">Round Summary - Round {summary.roundNumber}</h3>
          </div>
          <div className="card-body">
            <p><strong>Total Questions:</strong> {summary.totalQuestions}</p>
            <p><strong>Correct Answers:</strong> {summary.correctCount}</p>
            <p><strong>Percentage Score:</strong> {summary.percentage.toFixed(2)}%</p>
            <hr />
            <h5>Updated Mastery</h5>
            <ul className="list-group list-group-flush">
              {Object.keys(summary.mastery).map(topic => (
                <li key={topic} className="list-group-item">
                  <strong>{topic}:</strong> {(summary.mastery[topic] * 100).toFixed(2)}%
                </li>
              ))}
            </ul>
            <hr />
            <h4>Awarded Badge: <span className="badge bg-success">{summary.badge}</span></h4>
          </div>
          <div className="card-footer text-end">
            <button className="btn btn-outline-primary" onClick={handleBackToDashboard}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengeRoundSummaryPage;
