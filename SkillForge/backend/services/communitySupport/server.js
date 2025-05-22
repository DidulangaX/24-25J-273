const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO) {
      throw new Error("MongoDB connection string is missing! Check your .env file.");
    }

    await mongoose.connect(process.env.MONGO);
    console.log('✅ MongoDB connection successful!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Import Routes

const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const questionAnswerRoutes = require('./routes/questionAnswerRoutes');


// Use Routes

app.use('/api/community/questions', questionRoutes);
app.use('/api/community/answers', answerRoutes);
app.use('/api/community/questions', questionAnswerRoutes);




// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Community Support Service is running on port ${PORT}`);
});
