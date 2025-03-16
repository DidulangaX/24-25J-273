// scripts/retrainModel.js
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const path = require("path");
const TrainingExample = require("../models/TrainingExample");
const dotenv = require("dotenv");

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function retrainModel() {
  try {
    // Get all training examples that haven't been incorporated yet
    const examples = await TrainingExample.find({ modelIncorporated: false });

    if (examples.length === 0) {
      console.log("No new training examples to incorporate");
      process.exit(0);
    }

    console.log(
      `Found ${examples.length} new training examples to incorporate`
    );

    // Format the training data
    const trainingData = examples.map((example) => ({
      features: example.interactionData,
      target: example.perceivedDifficulty,
    }));

    // Write to a temporary file
    const fs = require("fs");
    const tempFile = path.join(__dirname, "../temp/training_data.json");
    fs.writeFileSync(tempFile, JSON.stringify(trainingData));

    // Call Python script to retrain the model
    const pythonScriptPath = path.join(__dirname, "../utils/train_model.py");
    const modelPath = path.join(
      __dirname,
      "../models/ml-models/random_forest_model.pkl"
    );

    const pythonProcess = spawn("python", [
      pythonScriptPath,
      tempFile,
      modelPath,
    ]);

    let stdOutput = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      stdOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      if (code === 0) {
        console.log("Model retrained successfully");
        console.log(stdOutput);

        // Update training examples to mark them as incorporated
        await TrainingExample.updateMany(
          { _id: { $in: examples.map((ex) => ex._id) } },
          { modelIncorporated: true }
        );

        console.log(`Updated ${examples.length} examples as incorporated`);
      } else {
        console.error("Error retraining model:", errorOutput);
      }

      // Clean up temp file
      fs.unlinkSync(tempFile);

      // Disconnect from MongoDB
      mongoose.disconnect();
    });
  } catch (error) {
    console.error("Error in retrainModel script:", error);
    process.exit(1);
  }
}

retrainModel();
