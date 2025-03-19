import React, { createContext, useState, useContext } from "react";

const LearningContext = createContext();

export const LearningProvider = ({ children }) => {
  const [difficultyLevel, setDifficultyLevel] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [interactionData, setInteractionData] = useState({});

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
