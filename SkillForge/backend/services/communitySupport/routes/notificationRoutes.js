// backend/routes/notificationRoutes.js
const express = require('express')
const auth    = require('../authMiddleware')            // your JWT guard
const ctrl    = require('../controllers/notificationController')
const tokCtrl = require('../controllers/deviceTokenController')
const router  = express.Router()

// 1️⃣ register a client’s FCM device token
router.post('/register', auth.authenticateToken, tokCtrl.registerToken)

// 2️⃣ broadcast to all tokens
router.post('/broadcast', auth.authenticateToken, ctrl.sendBroadcast)

module.exports = router
