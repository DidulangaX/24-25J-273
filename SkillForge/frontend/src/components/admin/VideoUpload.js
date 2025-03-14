// src/components/modulePage/VideoUpload.js
import React, { useState } from "react";
import axios from "axios";
import "./VideoUpload.css";

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !title) {
      setError("Please select a file and enter a title");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category || "general");
      formData.append("isRecommendation", "false");

      const response = await axios.post(
        "http://localhost:5000/api/videos",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload successful:", response.data);
      setUploadSuccess(true);

      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
    } catch (err) {
      console.error("Upload failed:", err);
      setError(
        "Upload failed: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <h2>Upload Learning Video</h2>

      {error && <div className="upload-error">{error}</div>}
      {uploadSuccess && (
        <div className="upload-success">Video uploaded successfully!</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Video Title:</label>
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
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            <option value="programming">Programming</option>
            <option value="database">Database</option>
            <option value="networking">Networking</option>
            <option value="security">Security</option>
          </select>
        </div>

        <div className="form-group">
          <label>Video File:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
        </div>

        <button type="submit" disabled={isUploading} className="upload-btn">
          {isUploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload;
