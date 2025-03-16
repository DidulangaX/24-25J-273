// models/UserProfile.js
const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  learningStyle: {
    type: String,
    enum: ["visual", "auditory", "reading", "kinesthetic"],
    default: "visual",
  },
  preferredPace: {
    type: String,
    enum: ["slow", "moderate", "fast"],
    default: "moderate",
  },
  topicInterests: [String],
  skillLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  completedVideos: [
    {
      videoId: mongoose.Schema.Types.ObjectId,
      difficultyExperienced: String,
      engagementScore: Number,
      completedAt: Date,
    },
  ],
  commonChallenges: [String],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
