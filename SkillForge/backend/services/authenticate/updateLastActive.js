// SkillForge\backend\services\authenticate\updateLastActive.js
const User = require('./models/User'); // adjust path if needed

async function updateLastActive(req, res, next) {
  try {
    // req.user is set by authenticateToken
    if (req.user && req.user.userId) {
      await User.findByIdAndUpdate(req.user.userId, {
        lastActive: new Date()
      });
    }
  } catch (err) {
    console.error('Error updating lastActive:', err);
  }
  next();
}

module.exports = updateLastActive;
