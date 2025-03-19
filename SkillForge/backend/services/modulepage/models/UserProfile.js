const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },

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

  skillLevels: {
    type: Map,
    of: {
      level: Number,
      confidence: Number,
      lastUpdated: Date,
    },
    default: {},
  },

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

  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ "learningHistory.videoId": 1 });
userProfileSchema.index({ "learningHistory.tags": 1 });
userProfileSchema.index({ lastActivity: -1 });

module.exports = mongoose.model("UserProfile", userProfileSchema);
