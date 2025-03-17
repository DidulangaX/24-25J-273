// controllers/resourceController.js
const asyncHandler = require("express-async-handler");
const Resource = require("../models/Resource");
const path = require("path");
const fs = require("fs");

// Get ALL resources (for dashboard)
const getAllResources = asyncHandler(async (req, res) => {
  const resources = await Resource.find().sort({ createdAt: -1 });
  res.status(200).json(resources);
});

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

// Get a single resource by ID
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error("Resource not found");
  }

  res.status(200).json(resource);
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
      const filename = path.basename(req.file.path);
      filePath = `/uploads/pdfs/${filename}`;
      console.log("Web-accessible PDF path:", filePath);
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

// Update a resource
const updateResource = asyncHandler(async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found");
    }

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

    // Build update object
    const updateData = {};

    // Update basic fields if provided
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (type) updateData.type = type;
    if (recommendedFor !== undefined)
      updateData.recommendedFor = recommendedFor;

    // Type-specific fields
    if (type === "link" && url) updateData.url = url;
    if (type === "text" && content) updateData.content = content;

    // Handle PDF upload if present
    if (req.file && type === "pdf") {
      // Delete old file if it exists and is different
      if (resource.filePath && resource.filePath !== "") {
        const oldFilePath = path.join(
          __dirname,
          "..",
          "public",
          resource.filePath
        );
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (err) {
          console.error("Error deleting old file:", err);
        }
      }

      const filename = path.basename(req.file.path);
      updateData.filePath = `/uploads/pdfs/${filename}`;
    }

    // Update related fields if provided
    if (videoId !== undefined) updateData.videoId = videoId || null;
    if (sectionStart !== undefined)
      updateData.sectionStart = sectionStart ? Number(sectionStart) : null;
    if (sectionEnd !== undefined)
      updateData.sectionEnd = sectionEnd ? Number(sectionEnd) : null;
    if (tags) updateData.tags = tags.split(",").map((tag) => tag.trim());

    console.log("Updating resource with data:", updateData);

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a resource
const deleteResource = asyncHandler(async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found");
    }

    // Delete associated file if it exists
    if (resource.filePath && resource.filePath !== "") {
      const filePath = path.join(__dirname, "..", "public", resource.filePath);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted file:", filePath);
        }
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getAllResources,
  getResources,
  createResource,
  getResourcesForVideo,
  getResourceById,
  updateResource,
  deleteResource,
};
