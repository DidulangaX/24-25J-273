// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// MongoDB connection
const uri = process.env.MONGO;
mongoose
  .connect(uri, {
    // 5s timeout to fail early if network/whitelist is mis-configured
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('MongoDB connection successful!'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);  // quit if we can't reach the database
  });

// Routes
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interview', interviewRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Interview Preparation Service is running on port ${PORT}`);
});
