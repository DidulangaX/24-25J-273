// models/UserInteraction.js - completing the schema
const mongoose = require("mongoose");

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  pauseCount: { type: Number, default: 0 },
  skipCount: { type: Number, default: 0 },
  replayCount: { type: Number, default: 0 },
  replayDuration: { type: Number, default: 0 },
  skippedContent: { type: Number, default: 0 },
  // New fields
  tabSwitchCount: { type: Number, default: 0 },
  totalHiddenTime: { type: Number, default: 0 },
  totalInactiveTime: { type: Number, default: 0 },
  exitAttemptCount: { type: Number, default: 0 },
  tabVisibilityRatio: { type: Number, default: 1.0 },
  activeViewingRatio: { type: Number, default: 1.0 },
  tabSwitchFeedback: [
    {
      reason: {
        type: String,
        enum: ["search", "distracted", "documentation", "notes", "other"],
      },
      position: Number,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  userFeedback: {
    type: String,
    enum: ["easy", "justright", "difficult", ""],
    default: "",
  },
  difficultyPrediction: { type: Boolean, default: false },
  comments: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserInteraction", userInteractionSchema);
