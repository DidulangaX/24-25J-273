// FinalSummaryPage.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FinalSummaryBanner from "./FinalSummaryBanner";
import "./FinalSummaryBanner.css";
import "./FinalSummaryPage.css";
import { useNavigate } from 'react-router-dom';

function FinalSummaryPage() {
  const location = useLocation();
  const finalData = location.state?.finalData?.summary || location.state?.finalData;
  const userId = finalData?.user_id;
  const attemptNumber = finalData?.attemptNumber;

  const [aiFeedback, setAIFeedback] = useState(finalData?.aiAnalysis || null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!finalData || aiFeedback) return;

    // Only fetch if not already in state
    if (!finalData.aiAnalysis) {
      setLoadingAI(true);
      setError(null);
      
      fetch(`http://localhost:8051/api/adaptive/finalSummary?user_id=${userId}&attemptNumber=${attemptNumber}`)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          if (data.summary?.aiAnalysis) {
            setAIFeedback(transformAIData(data.summary.aiAnalysis));
          }
          setLoadingAI(false);
        })
        .catch(err => {
          console.error('Fetch error:', err);
          setError('Failed to load feedback. Please try again later.');
          setLoadingAI(false);
        });
    }
  }, [finalData, userId, attemptNumber]);

  // Transform backend AI data to frontend format
  const transformAIData = (aiData) => ({
    overview: aiData.overview || "Personalized performance analysis",
    strengths: aiData.strengths || [],
    improvementAreas: (aiData.weaknesses || []).map(weakness => ({
      topic: weakness.topic || "General Programming",
      whyWeak: weakness.issues?.join(', ') || "Needs improvement",
      nextSteps: aiData.studyPlan?.filter(plan => 
        plan.toLowerCase().includes(weakness.topic?.toLowerCase())
      ) || []
    })),
    recommendedResources: [
      "https://www.codecademy.com/learn/java",
      "https://leetcode.com/problemset/all/",
      "https://codingbat.com/java"
    ]
  });

  if (!finalData) {
    return (
      <div className="final-summary-page">
        <p className="no-data">No summary data available. Complete an attempt first.</p>
      </div>
    );
  }
  const navigate = useNavigate();


  return (
    <div className="final-summary-page">
        
     // Add back button near the banner
<FinalSummaryBanner
  userName="You"
  attemptNumber={attemptNumber}
  totalScore={finalData.total_score}
  badge={finalData.badge}
  onBack={() => navigate("/myAttempts")}
/>

      <div className="feedback-section">
        <h2>Performance Analysis</h2>
        
        {error && <p className="error-message">{error}</p>}

        {loadingAI && (
          <div className="loading-feedback">
            <div className="spinner"></div>
            <p>Generating personalized feedback...</p>
          </div>
        )}

        {aiFeedback && (
          <div className="ai-feedback">
            <div className="overview">
              <h3>Summary</h3>
              <p>{aiFeedback.overview}</p>
            </div>

            <div className="strengths-section">
              <h3>Your Strengths</h3>
              <ul>
                {aiFeedback.strengths.map((strength, index) => (
                  <li key={index} className="strength-item">
                    <span className="strength-icon">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="improvement-section">
              <h3>Areas for Improvement</h3>
              {aiFeedback.improvementAreas.map((area, index) => (
                <div key={index} className="improvement-area">
                  <div className="area-header">
                    <span className="topic-badge">{area.topic}</span>
                    <span className="weakness-reason">{area.whyWeak}</span>
                  </div>
                  {area.nextSteps.length > 0 && (
                    <div className="action-steps">
                      <h4>Recommended Actions:</h4>
                      <ul>
                        {area.nextSteps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="resources-section">
              <h3>Recommended Resources</h3>
              <div className="resource-cards">
                {aiFeedback.recommendedResources.map((resource, index) => (
                  <a 
                    key={index}
                    href={resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-card"
                  >
                    <span className="resource-icon">🌐</span>
                    <span className="resource-link">
                      {new URL(resource).hostname}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinalSummaryPage;