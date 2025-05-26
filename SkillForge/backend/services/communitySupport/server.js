// D:\24-25J-273\SkillForge\backend\services\communitySupport\server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');


const questionRoutes       = require('./routes/questionRoutes');
const answerRoutes         = require('./routes/answerRoutes');
const questionAnswerRoutes = require('./routes/questionAnswerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const PORT = process.env.PORT || 5002;

async function startService() {
  try {
    // 1️⃣ Connect to MongoDB
    if (!process.env.MONGO) {
      throw new Error('MongoDB connection string (MONGO) missing in .env');
    }
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser:    true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connection successful!');

    // 3️⃣ Now that DB+ML are ready, spin up Express
    const app = express();

    app.use(bodyParser.json());
    app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

    // Mount your routes
    app.use('/api/community/questions', questionRoutes);
    app.use('/api/community/answers',   answerRoutes);
    app.use('/api/community/questions', questionAnswerRoutes);
    app.use('/api/notifications', notificationRoutes);

    app.listen(PORT, () => {
      console.log(`🚀 Community Support Service is running on port ${PORT}`);
    });
  }
  catch (err) {
    console.error('❌ Failed to start service:', err);
    process.exit(1);
  }
}

startService();
