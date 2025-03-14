// controllers/resourceController.js
const asyncHandler = require("express-async-handler");
const Resource = require("../models/Resource");
const path = require("path");

// Get resources based on difficulty level
const getResources = asyncHandler(async (req, res) => {
  const { difficultyLevel } = req.params;
  if (!["easy", "justright", "difficult", "all"].includes(difficultyLevel)) {
    res.status(400);
    throw new Error("Invalid difficulty level");
  }
  let query = {};
  if (difficultyLevel !== "all") {
    query.recommendedFor = difficultyLevel;
  }
  const resources = await Resource.find(query);
  res.status(200).json(resources);
});

// Get resources for a specific video
const getResourcesForVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const resources = await Resource.find({ videoId });
  res.status(200).json(resources);
});

// Create a new resource
const createResource = asyncHandler(async (req, res) => {
  try {
    console.log("Resource creation request body:", req.body);
    console.log("Resource file:", req.file);

    const {
      title,
      description,
      type,
      url,
      content,
      recommendedFor,
      videoId,
      sectionStart,
      sectionEnd,
      tags,
    } = req.body;

    let filePath = "";
    if (req.file && type === "pdf") {
      filePath = req.file.path;
    }

    // Create resource object
    const resourceData = {
      title,
      description,
      type,
      filePath: type === "pdf" ? filePath : "",
      url: type === "link" ? url : "",
      content: type === "text" ? content : "",
      recommendedFor: recommendedFor || "",
    };

    // Add section-specific fields if provided
    if (videoId) resourceData.videoId = videoId;
    if (sectionStart) resourceData.sectionStart = Number(sectionStart);
    if (sectionEnd) resourceData.sectionEnd = Number(sectionEnd);
    if (tags) resourceData.tags = tags.split(",").map((tag) => tag.trim());

    console.log("Creating resource with data:", resourceData);

    const resource = await Resource.create(resourceData);
    res.status(201).json(resource);
  } catch (error) {
    console.error("Error creating resource:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getResources,
  createResource,
  getResourcesForVideo,
};
