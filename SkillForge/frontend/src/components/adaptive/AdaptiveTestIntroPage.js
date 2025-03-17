import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdaptiveTestIntroPage.css";

function AdaptiveTestIntroPage() {
  const navigate = useNavigate();

  // Animation effect on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll(".intro-section");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  const handleStartTest = () => {
    // If you want to direct them to MyAttempts so they can start a new attempt:
    navigate("/myAttempts");

    // Or if you want to create a new attempt automatically:
    //   fetch('http://localhost:8051/api/adaptive/newAttempt', ...)
    //   Then navigate('/questions') with attemptNumber, etc.
  };

  return (
    <div className="adaptive-intro-container">
      <div className="intro-hero">
        <h1 className="intro-title">Adaptive Skill Test</h1>
        <p className="intro-subtitle">
          Sharpen your Java coding skills with our adaptive 30-question test!
        </p>
      </div>

      <div className="intro-content">
        <div className="intro-section">
          <h2>How It Works</h2>
          <ul>
            <li>
              <strong>Adaptive Mastery:</strong> Our system tracks your
              performance and adjusts question difficulty in real time.
            </li>
            <li>
              <strong>Topic Coverage:</strong> We focus on key areas: OOP, Data
              Structures, Algorithms, and more.
            </li>
            <li>
              <strong>3 Rounds of 10 Questions:</strong> Each round
              progressively challenges you based on your results.
            </li>
            <li>
              <strong>Final Score & Badge:</strong> Earn points based on your
              speed and correctness. Unlock Bronze, Silver, Gold, or Diamond
              badges!
            </li>
          </ul>
        </div>

        <div className="intro-section">
          <h2>Scoring System</h2>
          <div className="scoring-highlight">
            <p>
              Correct on first try? <strong>+10</strong> points. Second attempt?
              <strong>+5</strong>. Third attempt? <strong>+2</strong>.
              Incorrect? <strong>0</strong>.
            </p>
            <p>
              Time taken and difficulty also adjust your{" "}
              <strong>mastery</strong>
              in each topic.
            </p>
          </div>
        </div>

        <div className="intro-section">
          <h2>What You Can Achieve</h2>
          <ul>
            <li>
              <strong>Personalized Growth:</strong> Tackle questions that match
              your level and evolve with your skill.
            </li>
            <li>
              <strong>Mastery Tracking:</strong> Identify weak spots and watch
              your mastery rise as you improve.
            </li>
            <li>
              <strong>Collect Badges:</strong> Earn Bronze, Silver, Gold, or
              Diamond to show off your prowess.
            </li>
            <li>
              <strong>Leaderboard Ranking:</strong> Climb to the top of our
              global scoreboard!
            </li>
          </ul>
        </div>
      </div>

      <div className="intro-action">
        <button className="start-test-btn" onClick={handleStartTest}>
          Start Your Test Now
        </button>
      </div>
    </div>
  );
}

export default AdaptiveTestIntroPage;
