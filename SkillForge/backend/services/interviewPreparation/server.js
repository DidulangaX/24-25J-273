// SKILLFORGE\backend\services\interviewPreparation\server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5001; // Use a different port for this service

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// MongoDB connection
mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('MongoDB connection successful!');
});

// Routes
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interview', interviewRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Interview Preparation Service is running on port ${PORT}`);
});