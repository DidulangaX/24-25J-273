const mongoose = require("mongoose");

const userInteractionSchema = new mongoose.Schema({
  userId: {
    // Change this from ObjectId to String
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
  replayDuration: { type: Number, default: 0 }, // in seconds
  skippedContent: { type: Number, default: 0 }, // in seconds
  userFeedback: {
    type: String,
    enum: ["easy", "justright", "difficult", ""],
    default: "",
  },
  difficultyPrediction: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserInteraction", userInteractionSchema);
