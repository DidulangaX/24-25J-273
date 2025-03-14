// src/services/videoService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const fetchVideos = async () => {
  try {
    const response = await axios.get(`${API_URL}/videos`);
    return response.data;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};

export const fetchVideoById = async (videoId) => {
  try {
    const response = await axios.get(`${API_URL}/videos/${videoId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching video ${videoId}:`, error);
    return null;
  }
};

export const trackInteraction = async (interactionData) => {
  try {
    await axios.post(`${API_URL}/videos/interaction`, interactionData);
    return true;
  } catch (error) {
    console.error("Error tracking interaction:", error);
    return false;
  }
};

export const getRecommendations = async (videoId, difficulty) => {
  try {
    const response = await axios.get(
      `${API_URL}/videos/${videoId}/recommendations`,
      { params: { difficulty } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return null;
  }
};
