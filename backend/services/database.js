const { User, Chat } = require('../db');

async function createChat(firstMessage, userId, chatId, guestId) {
  if (!firstMessage) return { error: 'First message is required' };
  if (!userId && !guestId) return { error: 'Auth or guestId required to save chat' };

  try {
    const id = chatId || crypto.randomUUID();
    const now = new Date().toISOString();
    const messages = [{ ...firstMessage, created_at: now }];

    const chat = new Chat({ _id: id, user_id: userId || null, guest_id: guestId || null, messages, created_at: now, updated_at: now });
    await chat.save();

    return { data: { id, user_id: userId, guest_id: guestId, messages, created_at: now, updated_at: now } };
  } catch (err) {
    return { error: err.message };
  }
}

async function appendMessage(chatId, message, userId, guestId) {
  if (!chatId) return { error: 'Chat ID is required' };
  if (!message) return { error: 'Message is required' };
  if (!userId && !guestId) return { error: 'Auth or guestId required' };

  try {
    const now = new Date().toISOString();
    const query = userId ? { _id: chatId, user_id: userId } : { _id: chatId, guest_id: guestId };
    const chat = await Chat.findOneAndUpdate(
      query,
      { $push: { messages: { ...message, created_at: now } }, $set: { updated_at: now } },
      { new: true }
    );
    if (!chat) return { error: 'Chat not found' };

    return { data: { id: chat._id, user_id: chat.user_id, guest_id: chat.guest_id, messages: chat.messages, created_at: chat.created_at, updated_at: chat.updated_at } };
  } catch (err) {
    return { error: err.message };
  }
}

async function getHistory(userId, limit = 20) {
  if (!userId) return { error: 'Auth required' };

  try {
    const chats = await Chat.find({ user_id: userId })
      .sort({ updated_at: -1 })
      .limit(limit)
      .lean();

    const data = chats.map((c) => ({ ...c, id: c._id }));
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

async function deleteChat(id, userId) {
  if (!id) return { error: 'ID is required' };
  if (!userId) return { error: 'Auth required' };

  try {
    await Chat.deleteOne({ _id: id, user_id: userId });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { createChat, appendMessage, getHistory, deleteChat };