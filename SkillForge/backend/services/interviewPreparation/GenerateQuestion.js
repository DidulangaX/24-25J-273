const mongoose = require('mongoose');
const InterviewQuestion = require('./models/InterviewQuestion'); 


// ✅ Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://dilshandidulanga:UXeOjdxWsMgDixZd@skillforge.hlmv8.mongodb.net/SkillForge", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Function to generate 300 coding questions dynamically
const generateQuestions = () => {
    const categories = ["Programming", "Data Structures", "Algorithms", "Software Development"];
    const difficulties = ["Easy", "Medium", "Hard"];
    
    const questionTemplates = [
        "Write a function to calculate the sum of two numbers.",
        "Implement a function to check if a number is even or odd.",
        "Write a program to print the Fibonacci series up to N terms.",
        "Create a function to find the maximum number in an array.",
        "Write a function to reverse a string without using built-in methods.",
        "Write a program to check if a string is a palindrome.",
        "Implement a function to check if a number is prime.",
        "Write a function to calculate the factorial of a number using recursion.",
        "Implement a sorting algorithm (Bubble Sort, Merge Sort, etc.).",
        "Create a program to find the shortest path in a graph using Dijkstra's Algorithm.",
        "Write a function that simulates a simple ATM system with deposit and withdrawal.",
        "Build a REST API to handle CRUD operations for user management."
    ];

    let questions = [];
    
    for (let i = 0; i < 300; i++) {
        let randomTemplate = questionTemplates[i % questionTemplates.length]; // Cycle through templates
        let category = categories[i % categories.length];
        let difficulty = difficulties[Math.floor(i / 100)]; // 100 Easy, 100 Medium, 100 Hard

        questions.push({
            question: randomTemplate,
            category: category,
            difficulty: difficulty
        });
    }

    return questions;
};

// Insert 300 generated questions into MongoDB
InterviewQuestion.insertMany(generateQuestions())
    .then(() => {
        console.log("✅ 300 Questions Inserted Successfully!");
        mongoose.connection.close();
    })
    .catch(err => {
        console.error("❌ Error inserting questions:", err);
    });
