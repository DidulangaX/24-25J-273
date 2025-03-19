// seedCodeQuestions.js

// Load environment variables and connect to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const InterviewQuestion = require('./models/InterviewQuestion'); // Adjust the path if necessary

// Connect to MongoDB
mongoose.connect(process.env.MONGO, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB connected for seeding code questions..."))
.catch((err) => console.error("MongoDB connection error:", err));

// Define your coding questions
const codeQuestions = [
  {
    question: "Write a function to reverse a string.",
    category: "Coding",
    questionType: "coding",
    difficulty: "Easy"
  },
  {
    question: "Write a function to check if a string is a palindrome.",
    category: "Coding",
    questionType: "coding",
    difficulty: "Medium"
  },
  {
    question: "Implement a function to find the factorial of a number using recursion.",
    category: "Coding",
    questionType: "coding",
    difficulty: "Medium"
  },
  {
    question: "Write a function to sort an array of numbers.",
    category: "Coding",
    questionType: "coding",
    difficulty: "Easy"
  },
  {
    question: "Implement a function to determine if a given number is prime.",
    category: "Coding",
    questionType: "coding",
    difficulty: "Medium"
  }
];

// Insert the coding questions into the database
InterviewQuestion.insertMany(codeQuestions)
  .then((docs) => {
    console.log("Code questions inserted successfully:", docs);
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("Error inserting code questions:", err);
    mongoose.connection.close();
  });
