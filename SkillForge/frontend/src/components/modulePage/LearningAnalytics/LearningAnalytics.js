// Import statements at the top
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LearningAnalytics.css";

const LearningAnalytics = ({ videoId, userId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [resources, setResources] = useState([]);

  const analyzeLearning = async () => {
    if (!videoId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      // Get difficulty detection results
      const response = await axios.post(
        `http://localhost:5000/api/videos/detect-difficulty/${videoId}`,
        { userId }
      );

      if (response.data && response.data.success) {
        setAnalytics(response.data);

        // Look for problematic sections
        if (response.data.interactionSummary.problematic_sections) {
          // Fetch resources for these sections
          await fetchSectionResources(
            videoId,
            response.data.interactionSummary.problematic_sections
          );
        }
      } else {
        setError(
          response.data?.message || "Failed to analyze learning pattern"
        );
      }
    } catch (err) {
      console.error("Error analyzing learning:", err);
      if (err.response?.status === 404) {
        setError("Not enough viewing data. Please watch more of the video.");
      } else {
        setError("Failed to analyze learning pattern. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources for problematic sections
  const fetchSectionResources = async (videoId, sections) => {
    try {
      // Collect unique section timeframes
      const sectionPromises = sections.map((section) => {
        return axios.get(
          `http://localhost:5000/api/videos/resources/video/${videoId}`
        );
      });

      const results = await Promise.all(sectionPromises);

      // Combine and filter resources
      let allResources = [];
      results.forEach((result) => {
        if (result.data && Array.isArray(result.data)) {
          allResources = [...allResources, ...result.data];
        }
      });

      // Filter for section-specific resources
      const filteredResources = allResources.filter((resource) => {
        if (!resource.sectionStart && !resource.sectionEnd) return true;

        // Check if resource applies to any problematic section
        return sections.some((section) => {
          return (
            resource.sectionStart <= section.endTime &&
            resource.sectionEnd >= section.startTime
          );
        });
      });

      // Remove duplicates
      const uniqueResources = filteredResources.reduce((acc, current) => {
        const isDuplicate = acc.some((item) => item._id === current._id);
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);

      setResources(uniqueResources);
    } catch (error) {
      console.error("Error fetching section resources:", error);
    }
  };

  // Helper to format video timestamp
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Jump to a specific timestamp in the video
  const jumpToTimestamp = (seconds) => {
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.currentTime = seconds;
      videoElement.play();
    }
  };

  // Open a resource URL
  const openResource = (resource) => {
    if (resource.type === "link" && resource.url) {
      window.open(resource.url, "_blank");
    } else if (resource.type === "pdf" && resource.filePath) {
      // Extract the filename from the filepath
      const filename = resource.filePath.split("\\").pop().split("/").pop();
      window.open(`http://localhost:5000/uploads/pdfs/${filename}`, "_blank");
    } else if (resource.type === "text" && resource.content) {
      // Show text content in a modal or expand it in the UI
      // (You'll need to implement a modal component for this)
      alert(resource.content);
    }
  };

  return (
    <div className="learning-analytics">
      {!showAnalytics ? (
        <button
          className="analyze-button"
          onClick={() => {
            setShowAnalytics(true);
            analyzeLearning();
          }}
        >
          Analyze My Learning Pattern
        </button>
      ) : (
        <div className="analytics-results">
          {loading && (
            <div className="loading">Analyzing your learning pattern...</div>
          )}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setShowAnalytics(false)}>Close</button>
            </div>
          )}
          {analytics && (
            <div className="results-container">
              <h3>Learning Analysis Results</h3>
              <div className="difficulty-assessment">
                <div className="difficulty-label">Content Difficulty:</div>
                <div
                  className={`difficulty-value ${
                    analytics.prediction.predicted_difficulty === 1
                      ? "difficult"
                      : "easy"
                  }`}
                >
                  {analytics.prediction.predicted_difficulty === 1
                    ? "Challenging"
                    : "Manageable"}
                </div>
                <div className="confidence">
                  Confidence:{" "}
                  {Math.round(analytics.prediction.confidence * 100)}%
                </div>
              </div>

              {/* Insights Section */}
              {analytics.prediction.insights && (
                <div className="insights">
                  <h4>Analysis Insights:</h4>
                  <ul>
                    {analytics.prediction.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Problematic Sections */}
              {analytics.interactionSummary.problematic_sections &&
                analytics.interactionSummary.problematic_sections.length >
                  0 && (
                  <div className="difficult-sections">
                    <h4>Sections You Found Challenging:</h4>
                    <ul>
                      {analytics.interactionSummary.problematic_sections.map(
                        (section, index) => (
                          <li key={index} className="section-item">
                            <div className="section-details">
                              <span className="section-time">
                                {formatTime(section.startTime)} -{" "}
                                {formatTime(section.endTime)}
                              </span>
                              <button
                                className="jump-button"
                                onClick={() =>
                                  jumpToTimestamp(section.startTime)
                                }
                              >
                                Review Section
                              </button>
                            </div>
                            <div className="section-metrics">
                              {section.replayCount > 0 && (
                                <span className="replay-info">
                                  Replayed {section.replayCount} times
                                </span>
                              )}
                              {section.pauseCount > 0 && (
                                <span className="pause-info">
                                  Paused {section.pauseCount} times
                                </span>
                              )}
                            </div>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Recommendations */}
              {analytics.recommendations &&
                analytics.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>Personalized Recommendations:</h4>
                    <ul>
                      {analytics.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Resource Recommendations */}
              {resources.length > 0 && (
                <div className="recommended-resources">
                  <h4>Learning Resources:</h4>
                  <div className="resource-cards">
                    {resources.map((resource, index) => (
                      <div className="resource-card" key={index}>
                        <div className="resource-title">{resource.title}</div>
                        <div className="resource-description">
                          {resource.description}
                        </div>
                        {resource.sectionStart !== undefined &&
                          resource.sectionEnd !== undefined && (
                            <div className="resource-section">
                              For section: {formatTime(resource.sectionStart)} -{" "}
                              {formatTime(resource.sectionEnd)}
                            </div>
                          )}
                        <div className="resource-actions">
                          <button
                            className="resource-button"
                            onClick={() => openResource(resource)}
                          >
                            {resource.type === "link"
                              ? "Open Link"
                              : resource.type === "pdf"
                              ? "View PDF"
                              : "Read Content"}
                          </button>
                          {resource.sectionStart !== undefined && (
                            <button
                              className="section-jump-button"
                              onClick={() =>
                                jumpToTimestamp(resource.sectionStart)
                              }
                            >
                              Jump to Section
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="analytics-actions">
                <button onClick={() => analyzeLearning()}>Refresh</button>
                <button onClick={() => setShowAnalytics(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningAnalytics;
