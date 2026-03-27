const db = require('../db');

function createChat(firstMessage, userId) {
  if (!firstMessage) return { error: 'First message is required' };
  if (!userId) return { error: 'Auth required to save chat' };

  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const messages = JSON.stringify([{ ...firstMessage, created_at: now }]);

    db.prepare(
      'INSERT INTO chats (id, user_id, messages, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, messages, now, now);

    return { data: { id, user_id: userId, messages: JSON.parse(messages), created_at: now, updated_at: now } };
  } catch (err) {
    return { error: err.message };
  }
}

function appendMessage(chatId, message, userId) {
  if (!chatId) return { error: 'Chat ID is required' };
  if (!message) return { error: 'Message is required' };
  if (!userId) return { error: 'Auth required' };

  try {
    const row = db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?').get(chatId, userId);
    if (!row) return { error: 'Chat not found' };

    const now = new Date().toISOString();
    const existing = JSON.parse(row.messages || '[]');
    const updated = [...existing, { ...message, created_at: now }];
    const updatedStr = JSON.stringify(updated);

    db.prepare('UPDATE chats SET messages = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .run(updatedStr, now, chatId, userId);

    return { data: { id: chatId, user_id: userId, messages: updated, created_at: row.created_at, updated_at: now } };
  } catch (err) {
    return { error: err.message };
  }
}

function getHistory(userId, limit = 20) {
  if (!userId) return { error: 'Auth required' };

  try {
    const rows = db.prepare(
      'SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?'
    ).all(userId, limit);

    const data = rows.map((row) => ({
      ...row,
      messages: JSON.parse(row.messages || '[]'),
    }));

    return { data };
  } catch (err) {
    return { error: err.message };
  }
}

function deleteChat(id, userId) {
  if (!id) return { error: 'ID is required' };
  if (!userId) return { error: 'Auth required' };

  try {
    db.prepare('DELETE FROM chats WHERE id = ? AND user_id = ?').run(id, userId);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { createChat, appendMessage, getHistory, deleteChat };
