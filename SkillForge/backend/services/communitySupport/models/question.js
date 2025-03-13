const mongoose = require('mongoose');

//added user.js to fetch user data
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Instructor', 'Student'], default: 'Student' },
});

userSchema.pre('save', function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

mongoose.model('User', userSchema);

//questions mode
const questionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model from authenticate service
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [String], // Optional tags for categorization
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the question
    peerMatchRequested: { type: Boolean, default: false },
    // ... potentially add fields for status (open, closed, answered), etc.
});

// Set the custom collection name to "communityquestions"
module.exports = mongoose.model('Question', questionSchema, 'communityquestions');