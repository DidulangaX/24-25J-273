const asyncHandler = require("express-async-handler");
const UserInteraction = require("../models/UserInteraction");
const { spawn } = require("child_process");
const path = require("path");

// Record user interaction with video
const recordInteraction = asyncHandler(async (req, res) => {
  const {
    userId,
    videoId,
    pauseCount,
    skipCount,
    replayCount,
    replayDuration,
    skippedContent,
  } = req.body;

  // Check if there's an existing interaction record
  let interaction = await UserInteraction.findOne({ userId, videoId });

  if (interaction) {
    // Update existing record
    interaction.pauseCount = pauseCount;
    interaction.skipCount = skipCount;
    interaction.replayCount = replayCount;
    interaction.replayDuration = replayDuration;
    interaction.skippedContent = skippedContent;
    interaction.updatedAt = Date.now();

    await interaction.save();
  } else {
    // Create new record
    interaction = await UserInteraction.create({
      userId,
      videoId,
      pauseCount,
      skipCount,
      replayCount,
      replayDuration,
      skippedContent,
    });
  }

  // Call Python script to predict difficulty
  const pythonPath = path.join(__dirname, "../utils/difficulty_detector.py");
  const modelPath = path.join(
    __dirname,
    "../models/ml-models/random_forest_model.pkl"
  );

  const pythonProcess = spawn("python", [
    pythonPath,
    pauseCount,
    skipCount,
    replayCount,
    replayDuration,
    skippedContent,
    modelPath,
  ]);

  let prediction = "";

  pythonProcess.stdout.on("data", (data) => {
    prediction += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on("close", async (code) => {
    console.log(`Python process exited with code ${code}`);

    if (code === 0 && prediction) {
      const isDifficult = parseInt(prediction.trim()) === 1;

      // Update the prediction in the database
      interaction.difficultyPrediction = isDifficult;
      await interaction.save();

      res.status(200).json({
        success: true,
        interaction,
        isDifficult,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to predict difficulty",
        interaction,
      });
    }
  });
});

// Record user feedback on content difficulty
const recordUserFeedback = asyncHandler(async (req, res) => {
  const { userId, videoId, userFeedback } = req.body;

  if (!["easy", "justright", "difficult"].includes(userFeedback)) {
    res.status(400);
    throw new Error("Invalid feedback level");
  }

  let interaction = await UserInteraction.findOne({ userId, videoId });

  if (interaction) {
    interaction.userFeedback = userFeedback;
    await interaction.save();
  } else {
    interaction = await UserInteraction.create({
      userId,
      videoId,
      userFeedback,
    });
  }

  res.status(200).json({
    success: true,
    interaction,
  });
});

module.exports = {
  recordInteraction,
  recordUserFeedback,
};
