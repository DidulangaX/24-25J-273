// Save this as test-ml.js in your project root
const { spawn } = require("child_process");
const path = require("path");

const modelPath = path.resolve(
  __dirname,
  "./models/ml-models/random_forest_model.pkl"
);
const pythonPath = path.resolve(__dirname, "./utils/simple_predict.py");

// Sample data mimicking real interactions
const testData = {
  session_duration: 300,
  total_pauses: 5,
  pause_median_duration: 10,
  replay_frequency: 2,
  replay_duration: 30,
  seek_forward_frequency: 3,
  skipped_content: 45,
  speed_changes: 1,
  average_speed: 1.0,
  pause_rate: 1.0,
  replay_ratio: 0.1,
};

// Write test data to temp file
const fs = require("fs");
const tempFile = path.join(__dirname, "test-data.json");
fs.writeFileSync(tempFile, JSON.stringify(testData));

// Call Python script
console.log(`Testing ML model integration...`);
console.log(`Model path: ${modelPath}`);
console.log(`Python script: ${pythonPath}`);
console.log(`Test data: ${JSON.stringify(testData)}`);

const pythonProcess = spawn("python", [pythonPath, modelPath, tempFile]);

pythonProcess.stdout.on("data", (data) => {
  console.log(`Python stdout: ${data}`);
  try {
    const result = JSON.parse(data);
    console.log("Parsed result:", result);
  } catch (e) {
    console.log("Could not parse as JSON");
  }
});

pythonProcess.stderr.on("data", (data) => {
  console.error(`Python stderr: ${data}`);
});

pythonProcess.on("close", (code) => {
  console.log(`Python process exited with code ${code}`);
  // Clean up
  fs.unlinkSync(tempFile);
});
