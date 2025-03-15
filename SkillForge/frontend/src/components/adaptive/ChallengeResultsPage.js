// SkillForge\frontend\src\components\adaptive\ChallengeResultsPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ChallengeResultsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionResult, setSessionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}/results`);
      if (!res.ok) {
        throw new Error('Failed to fetch challenge results.');
      }
      const data = await res.json();
      setSessionResult(data);
    } catch (error) {
      setErrorMsg(error.message || 'Error loading results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h4>Loading challenge results...</h4>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="container mt-5 text-center">
        <h4 className="text-danger">{errorMsg}</h4>
      </div>
    );
  }

  if (!sessionResult) {
    return (
      <div className="container mt-5 text-center">
        <h4>No results available.</h4>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Challenge Results</h2>
      <p><strong>Session ID:</strong> {sessionResult._id}</p>
      <p><strong>Status:</strong> {sessionResult.status}</p>
      {sessionResult.result && (
        <div>
          <h4>Winner: {sessionResult.result.winner}</h4>
          <h5>Details:</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {sessionResult.result.details.map((r, index) => (
                <tr key={index}>
                  <td>{r.participant}</td>
                  <td>{r.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Return Home
      </button>
    </div>
  );
}

export default ChallengeResultsPage;
