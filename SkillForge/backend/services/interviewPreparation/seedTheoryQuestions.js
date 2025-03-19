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

// Define your theory questions
const codeQuestions = [
  {
    question: "What is the purpose of the 'this' keyword in Java?",
    category: "theory",
    questionType: "theory",
    difficulty: "Easy"
  },
  {
    question: "What is a deadlock in multithreading?",
    category: "theory",
    questionType: "theory",
    difficulty: "Medium"
  },
  {
    question: "What is a foreign key in a database?",
    category: "theory",
    questionType: "theory",
    difficulty: "Medium"
  },
  {
    question: "What is the difference between an abstract class and an interface?",
    category: "theory",
    questionType: "theory",
    difficulty: "Easy"
  },
  {
    question: "What is a constructor in object-oriented programming?",
    category: "theory",
    questionType: "theory",
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
