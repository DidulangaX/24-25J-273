// server.js in backend/services/adaptive
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // loads from .env in the same folder
const adaptiveRoutes = require('./routes/adaptiveRoutes');
const { authenticateToken } = require('./authMiddleware');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to Mongo
mongoose.connect(process.env.MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully for Adaptive component!');
});

// If you want all endpoints to require token, you can do:
// app.use(authenticateToken);

// Set up routes
app.use('/api/adaptive', adaptiveRoutes);

const PORT = process.env.PORT || 8051;
app.listen(PORT, () => {
  console.log(`Adaptive service running on port ${PORT}`);
});
