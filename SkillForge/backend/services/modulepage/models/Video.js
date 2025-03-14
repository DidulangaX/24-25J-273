const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // Main or Recommendation
  difficultyLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
  },
  filePath: { type: String, required: true },
  thumbnailPath: { type: String },
  duration: { type: Number }, // in seconds
  isRecommendation: { type: Boolean, default: false },
  recommendedFor: {
    type: String,
    enum: ["easy", "justright", "difficult", ""],
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
