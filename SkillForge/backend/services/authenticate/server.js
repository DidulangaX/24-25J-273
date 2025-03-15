//SkillForge\backend\services\authenticate\server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const { authenticateToken } = require('./authMiddleware');
const updateLastActive = require('./updateLastActive'); // the new file


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
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
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
// Enforce token & update lastActive for any route that needs user context
app.use(authenticateToken, updateLastActive);
// Then define or use your routes
app.use('/api/auth', authRoutes);


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
