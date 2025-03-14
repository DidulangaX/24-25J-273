// src/components/admin/ResourceUpload.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ResourceUpload.css";

const ResourceUpload = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [sectionStart, setSectionStart] = useState("");
  const [sectionEnd, setSectionEnd] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available videos
    const fetchVideos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videos");
        setVideos(response.data);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = async (e) => {
    const videoId = e.target.value;
    setSelectedVideo(videoId);

    if (videoId) {
      try {
        // Fetch existing resources for this video
        const response = await axios.get(
          `http://localhost:5000/api/videos/resources/video/${videoId}`
        );
        setResources(response.data);
        console.log("Fetched resources:", response.data);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
      }
    } else {
      setResources([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      // Add basic resource data
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("recommendedFor", difficulty);

      // Add section data if provided
      if (selectedVideo) {
        formData.append("videoId", selectedVideo);
      }

      if (sectionStart) {
        formData.append("sectionStart", sectionStart);
      }

      if (sectionEnd) {
        formData.append("sectionEnd", sectionEnd);
      }

      if (tags) {
        formData.append("tags", tags);
      }

      // Add content based on type
      if (type === "text") {
        formData.append("content", content);
      } else if (type === "link") {
        formData.append("url", url);
      } else if (file) {
        formData.append("pdf", file); // For PDF uploads
      }

      console.log("Submitting resource with data:", {
        title,
        description,
        type,
        videoId: selectedVideo,
        sectionStart,
        sectionEnd,
        tags,
        difficulty,
      });

      // Submit resource
      const response = await axios.post(
        "http://localhost:5000/api/videos/resources",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Resource creation response:", response.data);
      setMessage("Resource added successfully!");

      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setUrl("");
      setDifficulty("");
      setFile(null);
      setSectionStart("");
      setSectionEnd("");
      setTags("");

      // Refresh resources if a video is selected
      if (selectedVideo) {
        try {
          const resourceResponse = await axios.get(
            `http://localhost:5000/api/videos/resources/video/${selectedVideo}`
          );
          setResources(resourceResponse.data);
        } catch (error) {
          console.error("Error refreshing resources:", error);
        }
      }
    } catch (error) {
      console.error("Error adding resource:", error);
      setMessage("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="resource-upload-container">
      <h2>Add Learning Resource</h2>

      {message && (
        <div
          className={
            message.includes("Error") ? "error-message" : "success-message"
          }
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Resource Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Resource Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="text">Text</option>
            <option value="link">External Link</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {type === "text" && (
          <div className="form-group">
            <label>Content:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        )}

        {type === "link" && (
          <div className="form-group">
            <label>URL:</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
        )}

        {type === "pdf" && (
          <div className="form-group">
            <label>PDF File:</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>For Difficulty Level:</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All Difficulty Levels</option>
            <option value="easy">Easy</option>
            <option value="justright">Just Right</option>
            <option value="difficult">Difficult</option>
          </select>
        </div>

        <div className="form-section">
          <h3>Section Specific Resource (Optional)</h3>

          <div className="form-group">
            <label>Video:</label>
            <select value={selectedVideo} onChange={handleVideoSelect}>
              <option value="">Select a video (optional)</option>
              {videos.map((video) => (
                <option key={video._id} value={video._id}>
                  {video.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group time-inputs">
            <div>
              <label>Section Start (seconds):</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={sectionStart}
                onChange={(e) => setSectionStart(e.target.value)}
              />
            </div>
            <div>
              <label>Section End (seconds):</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={sectionEnd}
                onChange={(e) => setSectionEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma separated):</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., functions, loops, basics"
            />
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Adding..." : "Add Resource"}
        </button>
      </form>

      {resources.length > 0 && (
        <div className="existing-resources">
          <h3>Existing Resources for Selected Video</h3>
          <div className="resource-list">
            {resources.map((resource) => (
              <div key={resource._id} className="resource-item">
                <div className="resource-title">{resource.title}</div>
                <div className="resource-description">
                  {resource.description}
                </div>
                {resource.sectionStart && resource.sectionEnd && (
                  <div className="resource-section">
                    Section: {formatTime(resource.sectionStart)} -{" "}
                    {formatTime(resource.sectionEnd)}
                  </div>
                )}
                <div className="resource-type">
                  Type:{" "}
                  {resource.type.charAt(0).toUpperCase() +
                    resource.type.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceUpload;
