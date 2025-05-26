// backend/controllers/notificationController.js
const { broadcastNotification } = require('../services/notificationService')

exports.sendBroadcast = async (req, res) => {
  try {
    const { title, body } = req.body
    const result = await broadcastNotification(title, body)
    res.json({
      success:      true,
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors:       result.responses.filter(r => !r.success).map(r => r.error.toString())
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
