import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8051/api/adaptive/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Leaderboard error:', err);
        setLoading(false);
      });
  }, []);

  // Optional: define a max score for progress bar reference
  // or compute from the highest score among leaders
  const maxScore = leaders.length > 0 
    ? leaders[0].total_score 
    : 100;

  const getProgressWidth = (score) => {
    if (maxScore === 0) return '0%';
    // compute ratio
    const ratio = (score / maxScore) * 100;
    return ratio.toFixed(2) + '%';
  };

  // highlight top 3 ranks
  const getRowStyle = (rank) => {
    if (rank === 1) {
      return { backgroundColor: '#ffd70022' }; // light gold highlight
    } else if (rank === 2) {
      return { backgroundColor: '#c0c0c022' }; // light silver highlight
    } else if (rank === 3) {
      return { backgroundColor: '#cd7f3222' }; // light bronze highlight
    }
    return {};
  };

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>

      {loading && <p className="leaderboard-loading">Loading...</p>}

      {!loading && leaders.length === 0 && (
        <p className="leaderboard-empty">No data to display.</p>
      )}

      {!loading && leaders.length > 0 && (
        <table className="leaderboard-table fade-in">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Badge</th>
              <th>Score</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((u, idx) => {
              const rank = idx + 1;
              const progressWidth = getProgressWidth(u.total_score);
              return (
                <tr key={u.user_id} style={getRowStyle(rank)} className={`rank-row rank-${rank}`}>
                  <td className="rank-cell">{rank}</td>
                  <td>{u.user_id}</td>
                  <td>{u.badge || '—'}</td>
                  <td>{u.total_score}</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: progressWidth }}
                      >
                        {u.total_score}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;