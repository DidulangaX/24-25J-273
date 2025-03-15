// SkillForge\frontend\src\components\adaptive\ChallengeWaitingPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ChallengeWaitingPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchSessionStatus();
    }, 5000); // poll every 5 seconds

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [sessionId]);

  useEffect(() => {
    // Initial fetch
    fetchSessionStatus();
  }, [sessionId]);

  const fetchSessionStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8051/api/adaptive/challenge/${sessionId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch challenge session');
      }
      const data = await res.json();
      setSession(data);

      // If session status becomes active or completed, navigate to challenge page
      if (data.status === 'active' || data.status === 'completed') {
        navigate(`/challenge/${sessionId}`);
      }

      // Update remaining time if endTime is provided
      if (data.endTime) {
        const endTime = new Date(data.endTime).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setRemainingTime(remaining);
      }
    } catch (error) {
      setErrorMsg(error.message || 'Error loading session status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 text-center">
      <h2>Waiting for Challenge Acceptance</h2>
      <p>Your Challenge Session ID: {sessionId}</p>
      {remainingTime !== null && (
        <p>Time remaining: {remainingTime} seconds</p>
      )}
      {loading ? (
        <p>Loading session status...</p>
      ) : errorMsg ? (
        <p className="text-danger">{errorMsg}</p>
      ) : (
        <p>Waiting for all participants to accept the challenge...</p>
      )}
    </div>
  );
}

export default ChallengeWaitingPage;
