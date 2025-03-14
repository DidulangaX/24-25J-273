// src/components/modulePage/VideoPlayer/VideoPlayer.js
import React, { useRef, useState } from "react";
import axios from "axios";
import "./VideoPlayer.css";

const VideoPlayer = ({ videoId, videoUrl, userId }) => {
  const videoRef = useRef(null);
  const [interactionCount, setInteractionCount] = useState(0);

  // Simple interaction tracking
  const trackInteraction = async (type, data = {}) => {
    try {
      // Always include current position
      const position = videoRef.current ? videoRef.current.currentTime : 0;

      const payload = {
        videoId,
        userId,
        interactionType: type,
        position,
        timestamp: new Date().toISOString(),
        ...data,
      };

      console.log(`Sending ${type} interaction:`, payload);

      const response = await axios.post(
        "http://localhost:5000/api/videos/interaction",
        payload
      );

      setInteractionCount((prev) => prev + 1);
      return response.data;
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  };

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        width="100%"
        onPlay={() => trackInteraction("play")}
        onPause={() => trackInteraction("pause")}
        onSeeked={() => trackInteraction("seek")}
        onRateChange={() => {
          const speed = videoRef.current ? videoRef.current.playbackRate : 1;
          trackInteraction("speed", { speed });
        }}
        onEnded={() => trackInteraction("end")}
      />
      <div className="interaction-count">Interactions: {interactionCount}</div>
    </div>
  );
};

export default VideoPlayer;
