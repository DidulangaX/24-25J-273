//SkillForge\frontend\src\components\adaptive\Leaderboard.js
import React, { useEffect, useState } from 'react';

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8051/api/adaptive/leaderboard')
      .then(res => res.json())
      .then(data => setLeaders(data))
      .catch(err => console.error('Leaderboard error:', err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Leaderboard</h2>
      <table style={{ width: '400px', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>User</th><th>Score</th></tr>
        </thead>
        <tbody>
          {leaders.map((u, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.user_id}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.total_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
