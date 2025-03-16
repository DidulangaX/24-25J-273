// models/Video.js
const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  difficultyLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "intermediate",
  },

  filePath: { type: String, required: true },
  thumbnailPath: { type: String },
  duration: { type: Number },
  isRecommendation: { type: Boolean, default: false },

  recommendedFor: {
    type: String,
    enum: ["easy", "justright", "difficult", ""],
    default: "",
  },

  sequenceId: { type: String },
  sequencePosition: { type: Number },
  level: { type: Number, min: 1, max: 5, default: 3 },
  tags: [{ type: String }],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Video", videoSchema);
