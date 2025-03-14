// models/Resource.js
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["pdf", "link", "text"], required: true },
  filePath: { type: String },
  url: { type: String },
  content: { type: String },
  recommendedFor: {
    type: String,
    enum: ["easy", "justright", "difficult", ""],
    default: "",
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
  },
  sectionStart: { type: Number },
  sectionEnd: { type: Number },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resource", resourceSchema);
