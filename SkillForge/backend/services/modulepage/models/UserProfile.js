// models/UserProfile.js
const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },

  // Learning history - videos watched with metadata
  learningHistory: [
    {
      videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
      videoTitle: String,
      category: String,
      tags: [String],
      difficulty: {
        type: String,
        enum: ["easy", "justright", "difficult", ""],
      },
      watchDate: {
        type: Date,
        default: Date.now,
      },
      interactionSummary: {
        duration: Number,
        pauseCount: Number,
        replayCount: Number,
        completionRatio: Number,
      },
    },
  ],

  // Skill levels across different topics
  skillLevels: {
    type: Map,
    of: {
      level: Number,
      confidence: Number,
      lastUpdated: Date,
    },
    default: {},
  },

  // User preferences
  preferences: {
    learningStyle: {
      type: String,
      enum: [
        "visual",
        "auditory",
        "reading-writing",
        "kinesthetic",
        "balanced",
        "undetermined",
      ],
      default: "undetermined",
    },
    contentTypes: [String],
    pacePreference: {
      type: String,
      enum: ["slow", "medium", "fast"],
      default: "medium",
    },
  },

  // Timestamp fields
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

// Add indices for efficient queries
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ "learningHistory.videoId": 1 });
userProfileSchema.index({ "learningHistory.tags": 1 });
userProfileSchema.index({ lastActivity: -1 });

module.exports = mongoose.model("UserProfile", userProfileSchema);
