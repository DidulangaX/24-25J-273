// backend/models/deviceToken.js
const mongoose = require('mongoose')
const deviceTokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token:     { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
})
module.exports = mongoose.model('DeviceToken', deviceTokenSchema)
