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
const communityRoutes = require('./routes/communityRoutes');
app.use('/api/community', communityRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Community Support Service is running on port ${PORT}`);
});