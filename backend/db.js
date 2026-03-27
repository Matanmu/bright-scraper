const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  created_at: { type: String, required: true },
});

const chatSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  user_id: { type: String, required: true, index: true },
  messages: { type: Array, default: [] },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = { connectDB, User, Chat };