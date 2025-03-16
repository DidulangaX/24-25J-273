import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import './ChallengeFriendsPage.css';

function ChallengeFriendsPage() {
  const navigate = useNavigate();

  // Current username or user info
  const [currentUsername, setCurrentUsername] = useState('');

  // Active users
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Pending challenges for this user
  const [pendingChallenges, setPendingChallenges] = useState([]);

  // For creating challenge: questionCount, difficulty, etc.
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');

  // Potential error or status messages
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // API base URLs
  const baseUrlAuth = 'http://localhost:5000/api/auth'; 
  const baseUrlAdaptive = 'http://localhost:8051/api/adaptive';

  // Token from cookies if your backend requires Bearer
  const token = Cookies.get('authToken'); 

  // Search filter for active users
  const [searchTerm, setSearchTerm] = useState('');

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
        setErrorMsg('Please select at least one participant');
        return;
      }
      setStatusMsg('Creating challenge...');
      setErrorMsg('');

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

  // Get difficulty badge color
  const getDifficultyColor = (level) => {
    switch(level) {
      case 'easy': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'hard': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter active users based on search term
  const filteredUsers = activeUsers.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="challenge-friends-container">
      <div className="page-header">
        <h1>Challenge Friends</h1>
        <p className="subtitle">Compete with other users in skill-based challenges</p>
      </div>

      {errorMsg && (
        <div className="alert error-alert" role="alert">
          <i className="fa fa-exclamation-circle"></i> {errorMsg}
        </div>
      )}
      
      {statusMsg && (
        <div className="alert success-alert" role="alert">
          <i className="fa fa-info-circle"></i> {statusMsg}
        </div>
      )}

      <div className="challenge-content">
        {/* Left column: Active Users */}
        <div className="challenge-section users-section">
          <div className="section-header">
            <h2>Active Users</h2>
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button onClick={fetchActiveUsers} className="refresh-btn">
                <i className="fa fa-refresh"></i>
              </button>
            </div>
          </div>
          
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="select-col">Select</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">No active users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id || u.username} className={selectedParticipants.includes(u.username) ? 'selected-row' : ''}>
                      <td>
                        <label className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(u.username)}
                            onChange={() => handleSelectParticipant(u.username)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                      <td>
                        <div className="user-info">
                          <span className="avatar">{u.username.charAt(0).toUpperCase()}</span>
                          <span className="username">{u.username}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.lastActive ? formatDate(u.lastActive) : 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="challenge-options">
            <div className="options-container">
              <div className="option-group">
                <label>Question Count:</label>
                <div className="counter">
                  <button 
                    className="counter-btn"
                    onClick={() => setQuestionCount(prev => Math.max(1, prev - 1))}
                    disabled={questionCount <= 1}
                  >-</button>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                    min="1"
                    max="20"
                  />
                  <button 
                    className="counter-btn"
                    onClick={() => setQuestionCount(prev => Math.min(20, prev + 1))}
                    disabled={questionCount >= 20}
                  >+</button>
                </div>
              </div>
              
              <div className="option-group">
                <label>Difficulty:</label>
                <div className="difficulty-selector">
                  <button 
                    className={`difficulty-btn ${difficulty === 'easy' ? 'active easy' : ''}`}
                    onClick={() => setDifficulty('easy')}
                  >Easy</button>
                  <button 
                    className={`difficulty-btn ${difficulty === 'medium' ? 'active medium' : ''}`}
                    onClick={() => setDifficulty('medium')}
                  >Medium</button>
                  <button 
                    className={`difficulty-btn ${difficulty === 'hard' ? 'active hard' : ''}`}
                    onClick={() => setDifficulty('hard')}
                  >Hard</button>
                </div>
              </div>
            </div>

            <button 
              className={`create-challenge-btn ${selectedParticipants.length === 0 ? 'disabled' : ''}`}
              onClick={handleCreateChallenge}
              disabled={selectedParticipants.length === 0}
            >
              <i className="fa fa-trophy"></i> Create Challenge
              {selectedParticipants.length > 0 && (
                <span className="participants-count">{selectedParticipants.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Right column: Received Challenges */}
        <div className="challenge-section received-section">
          <div className="section-header">
            <h2>Received Challenges</h2>
            <button onClick={fetchPendingChallenges} className="refresh-btn">
              <i className="fa fa-refresh"></i>
            </button>
          </div>
          
          <div className="challenges-container">
            {pendingChallenges.length === 0 ? (
              <div className="no-challenges">
                <i className="fa fa-inbox empty-icon"></i>
                <p>No pending challenges</p>
                <span>Challenges from other users will appear here</span>
              </div>
            ) : (
              pendingChallenges.map(ch => (
                <div key={ch._id} className="challenge-card">
                  <div className="challenge-header">
                    <div className="creator-info">
                      <span className="creator-avatar">{ch.creator.charAt(0).toUpperCase()}</span>
                      <span className="creator-name">{ch.creator}</span>
                    </div>
                    <span className={`badge ${getDifficultyColor(ch.difficulty || 'medium')}`}>
                      {ch.difficulty || 'Medium'}
                    </span>
                  </div>
                  
                  <div className="challenge-body">
                    <div className="challenge-detail">
                      <span className="detail-label">Questions:</span>
                      <span className="detail-value">{ch.questionCount || 5}</span>
                    </div>
                    
                    <div className="challenge-detail">
                      <span className="detail-label">Participants:</span>
                      <div className="participants-list">
                        {ch.participants.map((p, i) => (
                          <span key={i} className="participant-tag">
                            {p.user}
                            {p.accepted && <i className="fa fa-check"></i>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="challenge-footer">
                    <button
                      className="accept-btn"
                      onClick={() => handleAcceptChallenge(ch._id)}
                    >
                      Accept Challenge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeFriendsPage;
