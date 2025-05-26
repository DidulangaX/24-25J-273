
// backend/services/communitySupport/config/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('../skillforge-557ef-firebase-adminsdk-fbsvc-70a3069827.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('✅ Firebase initialized; admin.apps count =', admin.apps.length);
module.exports = admin;