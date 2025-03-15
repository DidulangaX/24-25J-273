//SkillForge\frontend\src\components\adaptive\ChallengeFriendsPage.js
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';          // if you store token in cookies
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

function ChallengeFriendsPage() {
  const navigate = useNavigate();

  // 1) Current username or user info
  //    If you already have a global or local approach, adapt it:
  const [currentUsername, setCurrentUsername] = useState('');

  // 2) Active users
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // 3) Pending challenges for this user
  const [pendingChallenges, setPendingChallenges] = useState([]);

  // 4) For creating challenge: questionCount, difficulty, etc.
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');

  // 5) Potential error or status messages
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // 6) API base URLs (adjust if needed)
  const baseUrlAuth = 'http://localhost:5000/api/auth'; 
  const baseUrlAdaptive = 'http://localhost:8051/api/adaptive';

  // 7) Token from cookies if your backend requires Bearer
  const token = Cookies.get('authToken'); 

  // On component mount, fetch current user from localStorage
  useEffect(() => {
    // Example: reading from localStorage if you stored a user object
    // or from a "uData" with AES encryption
    const encryptedUData = localStorage.getItem('uData');
    if (encryptedUData) {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedUData, 
        process.env.REACT_APP_ENCRYPTION_SECRET
      ).toString(CryptoJS.enc.Utf8);

      try {
        const userData = JSON.parse(decrypted);
        if (userData?.username) {
          setCurrentUsername(userData.username);
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  // Once we know the username, fetch active users & pending challenges
  useEffect(() => {
    if (!currentUsername) return;

    fetchActiveUsers();
    fetchPendingChallenges();
    // eslint-disable-next-line
  }, [currentUsername]);

  // Fetch active users
  const fetchActiveUsers = async () => {
    try {
      setErrorMsg('');
      const res = await fetch(`${baseUrlAuth}/activeUsers`, {
        headers: {
          'Content-Type': 'application/json',
          // If your backend needs the token:
          'Authorization': token
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch active users');
      }
      const data = await res.json();
      // Filter out the current user if you don't want to show self
      const filtered = data.filter(u => u.username !== currentUsername);
      setActiveUsers(filtered);
    } catch (err) {
      setErrorMsg(err.message || 'Error fetching active users');
    }
  };

  // Fetch pending challenges for this user
  const fetchPendingChallenges = async () => {
    try {
      setErrorMsg('');
      const res = await fetch(
        `${baseUrlAdaptive}/challenge/pending?user=${encodeURIComponent(currentUsername)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          }
        }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch pending challenges');
      }
      const data = await res.json();
      setPendingChallenges(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error fetching pending challenges');
    }
  };

  // When user checks/unchecks a participant
  const handleSelectParticipant = (username) => {
    setSelectedParticipants(prev => {
      if (prev.includes(username)) {
        return prev.filter(p => p !== username);
      } else {
        return [...prev, username];
      }
    });
  };

  // Create challenge
  const handleCreateChallenge = async () => {
    try {
      if (selectedParticipants.length === 0) {
        alert('Please select at least one participant');
        return;
      }
      setStatusMsg('Creating challenge...');
      setErrorMsg('');

      // We can store participants as objects if using "accepted: false" approach
      // or keep them as strings, then convert on the backend.
      // If your ChallengeSession expects { user, accepted }, do it that way.
      // For now, we'll assume your backend is updated to store participants as subdocs
      // with { user, accepted: false }, so we pass an array of user strings,
      // and the server sets accepted=false internally.

      const body = {
        creator: currentUsername,
        participants: selectedParticipants,
        questionCount,
        difficulty
      };
      const res = await fetch(`${baseUrlAdaptive}/challenge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create challenge');
      }
      const data = await res.json();
      // data = newly created challenge
      setStatusMsg(`Challenge created! Session ID: ${data._id}`);
      // Optionally navigate the creator to the challenge page:
      navigate(`/challenge-waiting/${data._id}`);

    } catch (err) {
      setErrorMsg(err.message || 'Error creating challenge');
    }
  };

  // Accept challenge
  const handleAcceptChallenge = async (sessionId) => {
    try {
      setErrorMsg('');
      const body = { user: currentUsername };
      const res = await fetch(`${baseUrlAdaptive}/challenge/${sessionId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error accepting challenge');
      }
      const updatedSession = await res.json();
      // If status is 'active', we can redirect to the challenge page
      if (updatedSession.status === 'active') {
        navigate(`/challenge/${updatedSession._id}`);
      } else {
        // Not all participants accepted yet
        setStatusMsg(`Accepted. Waiting for others... (Session ${updatedSession._id})`);
      }
      // Refresh pending list so we don't keep seeing it
      fetchPendingChallenges();
    } catch (err) {
      setErrorMsg(err.message || 'Error accepting challenge');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Challenge Friends</h2>

      {errorMsg && (
        <div className="alert alert-danger" role="alert">
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div className="alert alert-info" role="alert">
          {statusMsg}
        </div>
      )}

      <div className="row">
        {/* Left column: Active Users */}
        <div className="col-md-6">
          <h4>Active Users</h4>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Select</th>
                <th>Username</th>
                <th>Email</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u) => (
                <tr key={u._id || u.username}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(u.username)}
                      onChange={() => handleSelectParticipant(u.username)}
                    />
                  </td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.lastActive).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '10px' }}>
            <label style={{ marginRight: '10px' }}>Question Count:</label>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
              style={{ width: '60px', marginRight: '20px' }}
            />
            <label style={{ marginRight: '10px' }}>Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ marginRight: '20px' }}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>

            <button className="btn btn-primary" onClick={handleCreateChallenge}>
              Create Challenge
            </button>
          </div>
        </div>

        {/* Right column: Received Challenges */}
        <div className="col-md-6">
          <h4>Received Challenges</h4>
          {pendingChallenges.length === 0 && (
            <p>No pending challenges.</p>
          )}
          {pendingChallenges.map(ch => (
            <div key={ch._id} className="card mb-3">
              <div className="card-body">
                <p><strong>Challenge ID:</strong> {ch._id}</p>
                <p><strong>Creator:</strong> {ch.creator}</p>
                <p><strong>Participants:</strong> {ch.participants.map(p => p.user).join(', ')}</p>
                <button
                  className="btn btn-success"
                  onClick={() => handleAcceptChallenge(ch._id)}
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChallengeFriendsPage;
