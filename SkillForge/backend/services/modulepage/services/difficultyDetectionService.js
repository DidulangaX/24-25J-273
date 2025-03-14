// difficultyDetectionService.js
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/**
 * Service for detecting user difficulty based on video interactions
 * Interfaces with the Python difficulty detection model
 */
class DifficultyDetectionService {
  constructor() {
    // Use absolute paths to avoid any directory issues
    this.modelPath = path.resolve(
      __dirname,
      "../models/ml-models/random_forest_model.pkl"
    );
    this.pythonPath = path.resolve(
      __dirname,
      "../utils/difficulty_detector.py"
    );
    this.tempDir = path.resolve(__dirname, "../temp");

    console.log(`Model path: ${this.modelPath}`);
    console.log(`Python path: ${this.pythonPath}`);
    console.log(`Temp directory: ${this.tempDir}`);

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Detect if a user is experiencing difficulty based on video interactions
   *
   * @param {Object} interactionData - User's video interaction data
   * @returns {Promise<Object>} - Difficulty prediction and insights
   */
  async detectDifficulty(interactionData) {
    try {
      // Create sanitized data with exact feature order from model
      const sanitizedData = this._sanitizeData(interactionData);

      console.log("Sending to model:", sanitizedData);

      // Call Python model to predict difficulty
      try {
        const prediction = await this._callPythonModel(sanitizedData);

        // Generate insights based on the prediction
        const insights = this.generateInsights(prediction, sanitizedData);

        return {
          success: true,
          prediction,
          insights,
          interactionData: sanitizedData,
        };
      } catch (modelError) {
        console.error("Model prediction error:", modelError);

        // Create a fallback prediction when the model fails
        const fallbackPrediction = {
          predicted_difficulty: 0,
          confidence: 0.5,
          insights: ["Based on limited analysis (fallback due to model error)"],
        };

        const fallbackInsights = this.generateInsights(
          fallbackPrediction,
          sanitizedData
        );

        return {
          success: true,
          prediction: fallbackPrediction,
          insights: fallbackInsights,
          interactionData: sanitizedData,
          message: "Using fallback prediction due to model error",
        };
      }
    } catch (error) {
      console.error("Error detecting difficulty:", error);
      return {
        success: false,
        error: error.message,
        interactionData,
      };
    }
  }

  /**
   * Sanitize and prepare interaction data for the model
   *
   * @param {Object} interactionData - Raw interaction data
   * @returns {Object} - Clean, structured data for model
   */
  _sanitizeData(interactionData) {
    // Use the exact feature order expected by the model
    const expectedFeatures = [
      "session_duration",
      "total_pauses",
      "pause_median_duration",
      "replay_frequency",
      "replay_duration",
      "seek_forward_frequency",
      "skipped_content",
      "speed_changes",
      "average_speed",
      "pause_rate",
      "replay_ratio",
    ];

    // Create a sample with realistic defaults
    const sampleData = {
      session_duration: 300, // 5 minutes in seconds
      total_pauses: 0,
      pause_median_duration: 0,
      replay_frequency: 0,
      replay_duration: 0,
      seek_forward_frequency: 0,
      skipped_content: 0,
      speed_changes: 0,
      average_speed: 1.0,
      pause_rate: 0,
      replay_ratio: 0,
    };

    // Start with sample defaults
    const cleanData = { ...sampleData };

    // Override with valid values from interaction data
    for (const feature of expectedFeatures) {
      if (interactionData[feature] !== undefined) {
        // Ensure numeric values
        let value = Number(interactionData[feature]);

        // Handle NaN, Infinity, etc.
        if (!Number.isFinite(value)) {
          value = sampleData[feature]; // use default if invalid
        }

        cleanData[feature] = value;
      }
    }

    // Ensure derived values are reasonable
    // Fix session_duration (ensure at least 1 second)
    cleanData.session_duration = Math.max(cleanData.session_duration, 1);

    // Fix pause_rate (max 60 pauses per minute)
    const minutes = cleanData.session_duration / 60;
    cleanData.pause_rate = Math.min(
      cleanData.total_pauses / Math.max(minutes, 0.1),
      60
    );

    // Fix replay_ratio (0 to 1 range)
    cleanData.replay_ratio = Math.min(
      cleanData.replay_duration / Math.max(cleanData.session_duration, 1),
      1
    );

    return cleanData;
  }

  /**
   * Call Python model for difficulty prediction
   *
   * @param {Object} processedData - Processed interaction data
   * @returns {Promise<Object>} - Prediction results
   */
  async _callPythonModel(processedData) {
    return new Promise((resolve, reject) => {
      // Create unique file names for this request
      const requestId = uuidv4();
      const inputFile = path.join(this.tempDir, `input_${requestId}.json`);

      try {
        // Write input data to file
        fs.writeFileSync(inputFile, JSON.stringify(processedData));

        // Use the simple prediction script
        const pythonScript = path.resolve(
          __dirname,
          "../utils/simple_predict.py"
        );

        // Log the command that will be executed
        const pythonCommand = `python ${pythonScript} ${this.modelPath} ${inputFile}`;
        console.log(`Executing Python command: ${pythonCommand}`);

        // Spawn Python process
        const pythonProcess = spawn("python", [
          pythonScript,
          this.modelPath,
          inputFile,
        ]);

        let errorOutput = "";
        let stdOutput = "";

        // Set a timeout to kill the process if it takes too long
        const timeout = setTimeout(() => {
          try {
            pythonProcess.kill();
            reject(new Error("Python process timed out after 10 seconds"));
          } catch (error) {
            console.error("Error killing Python process:", error);
          }
        }, 10000); // 10 second timeout

        // Collect standard output
        pythonProcess.stdout.on("data", (data) => {
          stdOutput += data.toString();
          console.log(`Python stdout: ${data.toString()}`);
        });

        // Collect error output
        pythonProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
          console.error(`Python stderr: ${data.toString()}`);
        });

        // Handle process completion
        pythonProcess.on("close", (code) => {
          // Clear the timeout
          clearTimeout(timeout);

          // Cleanup input file
          try {
            if (fs.existsSync(inputFile)) {
              fs.unlinkSync(inputFile);
            }
          } catch (cleanupErr) {
            console.error("Error cleaning up input file:", cleanupErr);
          }

          if (code !== 0) {
            // Handle process failure with a fallback prediction
            console.error(
              `Python process failed with code ${code}: ${errorOutput}`
            );

            // Check if we can still extract JSON from stdout
            try {
              const jsonStartIndex = stdOutput.indexOf("{");
              const jsonEndIndex = stdOutput.lastIndexOf("}") + 1;

              if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                const jsonStr = stdOutput.substring(
                  jsonStartIndex,
                  jsonEndIndex
                );
                const prediction = JSON.parse(jsonStr);
                resolve(prediction);
                return;
              }
            } catch (jsonError) {
              console.error(
                "Failed to extract JSON from partial output:",
                jsonError
              );
            }

            // Return a fallback prediction
            resolve({
              predicted_difficulty: 0,
              confidence: 0.5,
              insights: ["Based on fallback prediction (process error)"],
            });
            return;
          }

          try {
            // Process normal successful output
            if (!stdOutput.trim()) {
              throw new Error("Empty output from Python script");
            }

            // Extract JSON from stdout (ignoring any debug logs)
            const jsonStartIndex = stdOutput.indexOf("{");
            const jsonEndIndex = stdOutput.lastIndexOf("}") + 1;

            if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
              const jsonStr = stdOutput.substring(jsonStartIndex, jsonEndIndex);
              const prediction = JSON.parse(jsonStr);
              resolve(prediction);
            } else {
              throw new Error(
                `No valid JSON found in Python output: ${stdOutput}`
              );
            }
          } catch (error) {
            console.error("Error processing Python output:", error);

            // Return a fallback prediction
            resolve({
              predicted_difficulty: 0,
              confidence: 0.5,
              insights: ["Based on fallback prediction (parsing error)"],
            });
          }
        });
      } catch (error) {
        // Clean up file if it exists
        try {
          if (fs.existsSync(inputFile)) {
            fs.unlinkSync(inputFile);
          }
        } catch (cleanupErr) {
          console.error("Error cleaning up input file:", cleanupErr);
        }

        reject(new Error(`Failed to call Python model: ${error.message}`));
      }
    });
  }

  /**
   * Update the model with new interaction data and user-reported difficulty
   *
   * @param {Object} interactionData - User's video interaction data
   * @param {number} reportedDifficulty - User-reported difficulty (0 or 1)
   * @returns {Promise<Object>} - Update results
   */
  async updateModel(interactionData, reportedDifficulty) {
    try {
      // Sanitize the data first
      const sanitizedData = this._sanitizeData(interactionData);

      // Add the user-reported difficulty
      sanitizedData.reported_difficulty = reportedDifficulty;

      // For now, log that we would update the model but don't actually call Python
      console.log("Model would be updated with:", sanitizedData);

      // Return success - in a production environment, you would call the Python script
      return {
        success: true,
        message: "Model update logged (actual update disabled for testing)",
        interactionData: sanitizedData,
      };
    } catch (error) {
      console.error("Error updating difficulty model:", error);
      return {
        success: false,
        error: error.message,
        interactionData,
      };
    }
  }

  /**
   * Generate learning insights based on difficulty prediction and interaction data
   *
   * @param {Object} prediction - Model prediction result
   * @param {Object} interactionData - User interaction data
   * @param {number} reportedDifficulty - User-reported difficulty level (if available)
   * @returns {Object} - Learning insights
   */
  generateInsights(prediction, interactionData, reportedDifficulty = null) {
    const isDifficult = prediction.predicted_difficulty === 1;
    const confidence = prediction.confidence || 0.5;

    // Calculate engagement score (0-100)
    const engagementScore = this._calculateEngagementScore(interactionData);

    // Determine difficulty level match if user reported difficulty
    const difficultyMatch =
      reportedDifficulty !== null
        ? prediction.predicted_difficulty === reportedDifficulty
        : null;

    // Extract specific insights from prediction
    const modelInsights = prediction.insights || [];

    // Get appropriate learning recommendations
    const recommendations = this._generateRecommendations(
      isDifficult,
      confidence,
      interactionData,
      prediction.top_factors || []
    );

    return {
      engagement: {
        score: engagementScore,
        level: this._getEngagementLevel(engagementScore),
        session_minutes: Math.round(interactionData.session_duration / 60),
      },
      difficulty: {
        predicted: isDifficult ? "Difficult" : "Not Difficult",
        confidence: Math.round(confidence * 100),
        reported:
          reportedDifficulty !== null
            ? reportedDifficulty === 1
              ? "Difficult"
              : "Not Difficult"
            : "Not Reported",
        match:
          difficultyMatch !== null
            ? difficultyMatch
              ? "Matched"
              : "Mismatched"
            : "Unknown",
      },
      insights: modelInsights,
      contributing_factors: prediction.top_factors || [],
      recommendations,
    };
  }

  /**
   * Calculate engagement score based on interaction patterns
   *
   * @param {Object} interactionData - User interaction data
   * @returns {number} - Engagement score (0-100)
   */
  _calculateEngagementScore(interactionData) {
    const {
      session_duration = 0,
      total_pauses = 0,
      replay_frequency = 0,
      replay_duration = 0,
      skipped_content = 0,
    } = interactionData;

    // Base score from session duration (max 50 points for 10+ minutes)
    const durationScore = Math.min(session_duration / 12, 50);

    // Replay score (active engagement through review)
    const replayScore = Math.min(replay_frequency * 5, 20);

    // Penalty for excessive skipping (disengagement)
    const skipPenalty = Math.min(skipped_content / 30, 20);

    // Pause score (some pauses show engagement, too many suggest difficulty)
    const pauseScore = total_pauses > 0 ? Math.min(10, total_pauses * 2) : 0;
    const pausePenalty = Math.max(0, (total_pauses - 5) * 2);

    // Calculate final score (capped between 0-100)
    return Math.max(
      0,
      Math.min(
        durationScore + replayScore + pauseScore - skipPenalty - pausePenalty,
        100
      )
    );
  }

  /**
   * Get engagement level description based on score
   *
   * @param {number} score - Engagement score
   * @returns {string} - Engagement level description
   */
  _getEngagementLevel(score) {
    if (score >= 80) return "High Engagement";
    if (score >= 60) return "Good Engagement";
    if (score >= 40) return "Moderate Engagement";
    if (score >= 20) return "Low Engagement";
    return "Very Low Engagement";
  }

  /**
   * Generate personalized recommendations based on difficulty prediction
   *
   * @param {boolean} isDifficult - Whether content is predicted as difficult
   * @param {number} confidence - Prediction confidence
   * @param {Object} interactionData - User interaction data
   * @param {Array} topFactors - Top contributing factors to difficulty
   * @returns {Array} - List of recommendations
   */
  _generateRecommendations(
    isDifficult,
    confidence,
    interactionData,
    topFactors
  ) {
    const recommendations = [];

    if (isDifficult) {
      // Recommendations for content perceived as difficult
      recommendations.push(
        "Consider reviewing prerequisite content before continuing"
      );

      // Check specific interaction patterns
      if (interactionData.total_pauses > 5) {
        recommendations.push(
          "Try taking notes during pauses to reinforce your understanding"
        );
      }

      if (interactionData.replay_frequency > 0) {
        recommendations.push(
          "Focus on the sections you replayed, they contain key concepts"
        );
      } else {
        recommendations.push(
          "Use the replay feature to review challenging sections"
        );
      }

      if (interactionData.average_speed < 1.0) {
        recommendations.push(
          "You've slowed down the video - consider additional practice exercises"
        );
      }

      // Add recommendations based on top contributing factors
      if (topFactors && Array.isArray(topFactors)) {
        for (const factor of topFactors) {
          if (
            factor.feature === "pause_median_duration" &&
            factor.contribution > 0
          ) {
            recommendations.push(
              "Try breaking down complex concepts into smaller parts"
            );
          }

          if (factor.feature === "skipped_content" && factor.contribution > 0) {
            recommendations.push(
              "Revisit the sections you skipped, they might contain important information"
            );
          }
        }
      }
    } else {
      // Recommendations for content not perceived as difficult
      if (interactionData.session_duration > 900) {
        // Over 15 minutes
        recommendations.push(
          "You seem to have a good grasp of this topic. Consider exploring related advanced content"
        );
      }

      if (interactionData.average_speed > 1.0) {
        recommendations.push(
          "Since you watched at a faster speed, you might be ready for more challenging content"
        );
      }

      if (
        interactionData.total_pauses < 2 &&
        interactionData.session_duration > 600
      ) {
        recommendations.push(
          "Try the practice exercises to reinforce your understanding"
        );
      }

      if (interactionData.seek_forward_frequency > 3) {
        recommendations.push(
          "You navigated quickly through parts of the content - consider a comprehensive review if needed"
        );
      }
    }

    // If we don't have many recommendations, add a general one
    if (recommendations.length < 2) {
      recommendations.push(
        isDifficult
          ? "Consider reaching out to peers or instructors for additional support"
          : "Continue with the recommended learning path"
      );
    }

    // Limit to 3 most relevant recommendations
    return recommendations.slice(0, 3);
  }
}

module.exports = DifficultyDetectionService;
