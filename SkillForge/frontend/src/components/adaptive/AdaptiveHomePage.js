// File: src/components/adaptive/AdaptiveHomePage.js

import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdaptiveHomePage.css";

function AdaptiveHomePage() {
  const navigate = useNavigate();

  const goToSkillTestIntro = () => {
    navigate("/adaptiveTestIntro");
  };

  const goToChallengeIntro = () => {
    navigate("/challenge-friends");
  };

  const goToMyAttempts = () => {
    navigate("/myAttempts");
  };

  const goToLeaderboard = () => {
    navigate("/leaderboard");
  };

  return (
    <div className="adaptive-home-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to SkillForge Adaptive!</h1>
        <p className="hero-subtitle">
          Master Java coding through personalized challenges, or compete with
          your friends.
        </p>
      </div>

      <div className="tiles-container">
        {/* Tile 1: Adaptive Skill Test */}
        <div
          className="tile tile-adaptive"
          onClick={() => navigate("/adaptiveTestIntro")}
        >
          <h2 className="tile-title">Adaptive Skill Test</h2>
          <p className="tile-body">
            Your personalized Java journey. Learn how it works!
          </p>
          <button className="tile-button">Learn More</button>
        </div>

        <div
          className="tile tile-challenge"
          onClick={() => navigate("/challengeIntro")}
        >
          <h2 className="tile-title">Challenge Your Buddies</h2>
          <p className="tile-body">
            Gather your friends and compete in a custom coding challenge. See
            who comes out on top!
          </p>
          <button className="tile-button">Battle Your Friends</button>
        </div>

        {/* Tile 3: My Achievements */}
        <div className="tile tile-achievements" onClick={goToMyAttempts}>
          <h2 className="tile-title">My Achievements</h2>
          <p className="tile-body">
            Check your past attempts, final scores, badges, and see how far
            you've come!
          </p>
          <button className="tile-button">View Your Progress</button>
        </div>

        {/* Tile 4: Leaderboard */}
        <div className="tile tile-leaderboard" onClick={goToLeaderboard}>
          <h2 className="tile-title">Check The Masters</h2>
          <p className="tile-body">
            Explore the top coders on our platform. Aim for that top spot and
            earn your crown!
          </p>
          <button className="tile-button">View Leaderboard</button>
        </div>
      </div>
    </div>
  );
}

export default AdaptiveHomePage;
