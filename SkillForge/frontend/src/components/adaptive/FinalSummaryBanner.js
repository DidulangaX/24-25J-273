// src/components/adaptive/FinalSummaryBanner.js
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./FinalSummaryBanner.css";

const badgeImages = {
  Bronze: "/images/bronze.jpg",
  Silver: "/images/silver.jpg",
  Gold: "/images/gold.jpg",
  Platinum: "/images/platinum.jpg",
  Diamond: "/images/diamond.jpg",
};

function FinalSummaryBanner({ userName, attemptNumber, totalScore, badge ,onBack }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setTimeout(() => setAnimate(true), 100); }, []);

  return (
    <div className={`summary-banner ${animate ? "animated" : ""}`}>
       
      {/* confetti */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="confetti"
               style={{
                 left: `${Math.random() * 100}%`,
                 animationDelay: `${Math.random() * 3}s`,
                 backgroundColor: `hsl(${Math.random() * 360},70%,60%)`
               }}/>
        ))}
      </div>

      {/* main content */}
      <div className="banner-content">
        <h1 className="title">
          <span className="title-text">Congratulations, </span>
          <span className="user-name">{userName}!</span>
        </h1>

        <div className="score-container">
          <div className="score-bubble attempt">
            <span className="score-label">Attempt</span>
            <span className="score-value">#{attemptNumber}</span>
          </div>
          <div className="score-bubble total">
            <span className="score-label">Score</span>
            <span className="score-value">{totalScore}</span>
          </div>
        </div>

        <div className={`badge-container ${badge.toLowerCase()}`}>
          <div className="badge-shine"></div>
          <img src={badgeImages[badge] || "/images/defaultBadge.jpg"}
               alt={`${badge} Badge`} className="badge-image"/>
          <div className="badge-ring"></div><div className="badge-glow"></div>
          <h2 className="badge-title">
            <span className="badge-label">Your Badge: </span>
            <span className="badge-name">{badge}</span>
          </h2>
        </div>

        <div className="ribbon"><div className="ribbon-left"></div><div className="ribbon-right"></div></div>
      </div>
    </div>
  );
}

FinalSummaryBanner.propTypes = {
  userName:      PropTypes.string.isRequired,
  attemptNumber: PropTypes.number.isRequired,
  totalScore:    PropTypes.number.isRequired,
  badge:         PropTypes.string.isRequired,
};

export default FinalSummaryBanner;
