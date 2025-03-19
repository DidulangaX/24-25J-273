// SKILLFORGE\backend\services\interviewPreparation\controllers\interviewController.js
const InterviewQuestion = require('../models/InterviewQuestion');
const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");

const submitAnswer = async (req, res) => {
  try {
      const { code } = req.body;

      if (!code || code.trim() === "") {
          return res.status(400).json({ message: "Code answer is required" });
      }

      console.log("Received code:", code);

      const scriptPath = path.join(__dirname, "../models/logicalErrorModel.py");

      const pythonProcess = spawn("python", [scriptPath, code]);

      let responseData = "";
      let errorData = "";

      pythonProcess.stdout.on("data", (data) => {
          responseData += data.toString();
      });

      pythonProcess.stderr.on("data", (error) => {
          errorData += error.toString();
      });

      pythonProcess.on("close", () => {
          if (errorData) {
              console.error("Python script error:", errorData);
              return res.status(500).json({ message: "Error processing response from AI model.", error: errorData });
          }

          console.log("🔥 Raw AI Model Response:", responseData); // <-- Log AI model output

          try {
              const parsedData = JSON.parse(responseData);
              res.status(200).json({ feedback: parsedData });
          } catch (parseError) {
              console.error("🚨 Error parsing Python script output:", parseError);
              res.status(500).json({ message: "Error parsing AI model output.", rawOutput: responseData });
          }
      });

  } catch (error) {
      console.error("Error analyzing code:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { submitAnswer };


const submitTheoryAnswer = async (req, res) => {
  try {
      const { code } = req.body;

      if (!code || code.trim() === "") {
          return res.status(400).json({ message: "Code answer is required" });
      }

      console.log("Received code:", code);

      const scriptPath = path.join(__dirname, "../models/theoryAnswerModel.py");

      const pythonProcess = spawn("python", [scriptPath, code]);

      let responseData = "";
      let errorData = "";

      pythonProcess.stdout.on("data", (data) => {
          responseData += data.toString();
      });

      pythonProcess.stderr.on("data", (error) => {
          errorData += error.toString();
      });

      pythonProcess.on("close", () => {
          if (errorData) {
              console.error("Python script error:", errorData);
              return res.status(500).json({ message: "Error processing response from AI model.", error: errorData });
          }

          console.log("🔥 Raw AI Model Response:", responseData); // <-- Log AI model output

          try {
              const parsedData = JSON.parse(responseData);
              res.status(200).json({ feedback: parsedData });
          } catch (parseError) {
              console.error("🚨 Error parsing Python script output:", parseError);
              res.status(500).json({ message: "Error parsing AI model output.", rawOutput: responseData });
          }
      });

  } catch (error) {
      console.error("Error analyzing code:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { submitTheoryAnswer };


// Add a new question (manual entry)
const addQuestion = async (req, res) => {
  try {
    const { question, answer, category, difficulty } = req.body;
    const newQuestion = new InterviewQuestion({ question, answer, category, difficulty });
    await newQuestion.save();
    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.log(error);
  }
};

// Get a question by ID
const getQuestionById = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


// Fetch 8 theory and 2 coding questions for an interview session
const getInterviewQuestions = async (req, res) => {
  try {
    // Fetch 8 theory questions
    const theoryQuestions = await InterviewQuestion.find({ questionType: 'theory' }).limit(8);
    
    // Fetch 2 coding questions
    const codingQuestions = await InterviewQuestion.find({ questionType: 'coding' }).limit(2);
    
    // Combine the questions
    const questions = [...theoryQuestions, ...codingQuestions];

    // Return the questions
    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.error(error);
  }
};


// Fetch a single question by index
const getQuestionByIndex = async (req, res) => {
  try {
    const { sessionId, index } = req.params;
    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (index < 0 || index >= session.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    res.status(200).json({ question: session.questions[index] });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
    console.error(error);
  }
};

module.exports = { addQuestion, getQuestionById, getInterviewQuestions, getQuestionByIndex,submitAnswer, submitTheoryAnswer };