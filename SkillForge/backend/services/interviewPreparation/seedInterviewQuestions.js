// scripts/seedInterviewQuestions.js

const mongoose = require('mongoose');
const InterviewQuestion = require('./models/InterviewQuestion');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO);

  const questions = [
    { question: "What is a computer?", category: "IT Basics", questionType: "theory", difficulty: "Easy" },
    { question: "Explain the difference between hardware and software.", category: "IT Basics", questionType: "theory", difficulty: "Easy" },
    { question: "What does CPU stand for and what is its role?", category: "Hardware", questionType: "theory", difficulty: "Easy" },
    { question: "Define RAM and its purpose.", category: "Hardware", questionType: "theory", difficulty: "Easy" },
    { question: "What is an operating system?", category: "Software", questionType: "theory", difficulty: "Easy" },
    { question: "Give three examples of popular operating systems.", category: "Software", questionType: "theory", difficulty: "Easy" },
    { question: "What is a file system?", category: "Software", questionType: "theory", difficulty: "Easy" },
    { question: "Explain what a network is.", category: "Networking", questionType: "theory", difficulty: "Easy" },
    { question: "What is IP addressing?", category: "Networking", questionType: "theory", difficulty: "Easy" },
    { question: "Define DNS and its function.", category: "Networking", questionType: "theory", difficulty: "Easy" },
    { question: "What is a web browser?", category: "Web", questionType: "theory", difficulty: "Easy" },
    { question: "Explain the purpose of HTTP.", category: "Web", questionType: "theory", difficulty: "Easy" },
    { question: "What is HTML used for?", category: "Web", questionType: "theory", difficulty: "Easy" },
    { question: "Define CSS and why it’s important.", category: "Web", questionType: "theory", difficulty: "Easy" },
    { question: "What is JavaScript primarily used for?", category: "Web", questionType: "theory", difficulty: "Easy" },
    { question: "Explain what a database is.", category: "Databases", questionType: "theory", difficulty: "Easy" },
    { question: "What is SQL?", category: "Databases", questionType: "theory", difficulty: "Easy" },
    { question: "Name two types of database models.", category: "Databases", questionType: "theory", difficulty: "Easy" },
    { question: "What is cloud computing?", category: "Cloud", questionType: "theory", difficulty: "Medium" },
    { question: "Give an example of a cloud service provider.", category: "Cloud", questionType: "theory", difficulty: "Medium" },
    { question: "Explain what virtualization means.", category: "Cloud", questionType: "theory", difficulty: "Medium" },
    { question: "What is cybersecurity?", category: "Security", questionType: "theory", difficulty: "Medium" },
    { question: "Define malware and give two examples.", category: "Security", questionType: "theory", difficulty: "Medium" },
    { question: "What is two-factor authentication?", category: "Security", questionType: "theory", difficulty: "Medium" },
    { question: "Explain the concept of backup and recovery.", category: "IT Operations", questionType: "theory", difficulty: "Medium" },
    { question: "What is version control?", category: "Development", questionType: "theory", difficulty: "Medium" },
    { question: "Name a popular version control system.", category: "Development", questionType: "theory", difficulty: "Medium" },
    { question: "What is Agile methodology?", category: "Development", questionType: "theory", difficulty: "Medium" },
    { question: "Explain the difference between HTTP and HTTPS.", category: "Web", questionType: "theory", difficulty: "Medium" },
    { question: "What is an API?", category: "Web", questionType: "theory", difficulty: "Medium" },
    { question: "What is polymorphism in OOP?", category: "OOP", questionType: "theory", difficulty: "Medium" },
    { question: "Explain inheritance in object-oriented programming.", category: "OOP", questionType: "theory", difficulty: "Medium" },
    { question: "Define encapsulation in OOP.", category: "OOP", questionType: "theory", difficulty: "Medium" },
    { question: "What is abstraction in OOP?", category: "OOP", questionType: "theory", difficulty: "Medium" },
    { question: "What is the difference between class and object?", category: "OOP", questionType: "theory", difficulty: "Easy" },
    { question: "Explain method overloading.", category: "OOP", questionType: "theory", difficulty: "Hard" },
    { question: "Explain method overriding.", category: "OOP", questionType: "theory", difficulty: "Hard" },
    { question: "What is multiple inheritance?", category: "OOP", questionType: "theory", difficulty: "Hard" },
    { question: "Define interface vs abstract class.", category: "OOP", questionType: "theory", difficulty: "Medium" },
    { question: "Explain constructor and destructor.", category: "OOP", questionType: "theory", difficulty: "Easy" },
  ];


  // Insert new questions
  await InterviewQuestion.insertMany(questions);
  console.log(`Inserted ${questions.length} theory questions.`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
