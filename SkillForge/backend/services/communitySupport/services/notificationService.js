// backend/services/communitySupport/services/notificationService.js
const admin       = require('../config/firebaseAdmin');
const DeviceToken = require('../models/deviceToken');

/**
 * Store or update this user's current FCM token
 */
async function registerToken(userId, token) {
  await DeviceToken.findOneAndUpdate(
    { userId },
    { token },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Broadcast a notification to all registered tokens
 */
async function broadcastNotification(title, body) {
  const tokens = await DeviceToken.find().distinct('token');
  if (!tokens.length) {
    throw new Error('No device tokens registered');
  }

  // Filter out any invalid/empty tokens
  const validTokens = tokens.filter(token => token && token.trim().length > 0);
  
  if (!validTokens.length) {
    throw new Error('No valid device tokens found');
  }

  // Use the modern sendEachForMulticast method instead of deprecated sendToDevice
  const message = {
    notification: {
      title: title,
      body: body
    },
    tokens: validTokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Process the response to match your expected format
    const result = {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map((resp, index) => ({
        success: resp.success,
        messageId: resp.messageId,
        error: resp.error,
        token: validTokens[index] // Include token for debugging
      }))
    };

    // Log failures for debugging
    if (response.failureCount > 0) {
      console.warn(`${response.failureCount} notifications failed to send`);
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${validTokens[index]}: ${resp.error?.message}`);
        }
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    throw new Error(`Failed to send notifications: ${error.message}`);
  }
}

module.exports = {
  registerToken,
  broadcastNotification
};