// File: src/components/adaptive/ChallengeIntroPage.js

import React from "react";
import { useNavigate } from "react-router-dom";
import "./ChallengeIntroPage.css"; // optional external CSS

function ChallengeIntroPage() {
  const navigate = useNavigate();

  const handleStartChallenge = () => {
    // e.g., navigate user to the route for your challenge friend page
    navigate("/challenge-friends");
  };

  return (
    <div className="challenge-intro-container">
      <div className="challenge-hero">
        <h1 className="challenge-title">Challenge Your Friends</h1>
        <p className="challenge-subtitle">
          Put your coding skills to the test in a head-to-head showdown!
        </p>
      </div>

      <div className="challenge-content">
        <section className="challenge-section">
          <h2>How It Works</h2>
          <ul>
            <li>
              <strong>Create a Session:</strong> Generate a custom challenge and
              invite your friends via a unique link or session ID.
            </li>
            <li>
              <strong>Live Competition:</strong> Code solutions simultaneously.
              Our system records attempts, correctness, and time taken.
            </li>
            <li>
              <strong>Compare & Share:</strong> Once the challenge ends, see
              each participant’s code, results, and final score.
            </li>
          </ul>
        </section>

        <section className="challenge-section">
          <h2>Why Compete?</h2>
          <ul>
            <li>
              <strong>Friendly Rivalry:</strong> A bit of competition boosts
              motivation!
            </li>
            <li>
              <strong>Improved Skills:</strong> Discuss different solutions and
              best practices.
            </li>
            <li>
              <strong>Bragging Rights:</strong> Show off your coding prowess to
              your squad.
            </li>
            <li>
              <strong>Leaderboard Glory:</strong> Earn extra points and climb
              the global scoreboard.
            </li>
          </ul>
        </section>
      </div>

      <div className="challenge-action">
        <button className="start-challenge-btn" onClick={handleStartChallenge}>
          Create / Join a Challenge
        </button>
      </div>
    </div>
  );
}

export default ChallengeIntroPage;
