const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO) {
      throw new Error("MongoDB URI is missing! Check your .env file.");
    }

    await mongoose.connect(process.env.MONGO);
    console.log('✅ MongoDB connection successful!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Routes
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interviews', interviewRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`✅ InterviewPreparation service running on port ${PORT}`);
});
