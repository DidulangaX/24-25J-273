// backend/controllers/deviceTokenController.js
const DeviceToken = require('../models/deviceToken')

exports.registerToken = async (req, res) => {
  try {
    const userId = req.user.userId           // from your authMiddleware
    const { token } = req.body
    if (!token) return res.status(400).json({ message: 'token is required' })

    await DeviceToken.findOneAndUpdate(
      { token },
      { userId, token },
      { upsert: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
