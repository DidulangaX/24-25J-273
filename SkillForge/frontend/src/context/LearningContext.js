// src/context/LearningContext.js
import React, { createContext, useState, useContext } from "react";

// Create the context
const LearningContext = createContext();

// Create a provider component
export const LearningProvider = ({ children }) => {
  const [difficultyLevel, setDifficultyLevel] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [interactionData, setInteractionData] = useState({});

  // Values to be provided to consumers
  const value = {
    difficultyLevel,
    setDifficultyLevel,
    currentVideoId,
    setCurrentVideoId,
    recommendations,
    setRecommendations,
    interactionData,
    setInteractionData,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};

// Custom hook for using this context
export const useLearningContext = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error(
      "useLearningContext must be used within a LearningProvider"
    );
  }
  return context;
};

export default LearningContext;
