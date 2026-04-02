const STORAGE_KEY = 'scraperGuestHistory_v1';
const TTL_MS = 28 * 24 * 60 * 60 * 1000; // 28 days

function load() {
  try {
    const chats = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const cutoff = Date.now() - TTL_MS;
    return chats.filter((c) => new Date(c.updated_at).getTime() > cutoff);
  } catch {
    return [];
  }
}

function persist(chats) {
  const cutoff = Date.now() - TTL_MS;
  const fresh = chats.filter((c) => new Date(c.updated_at).getTime() > cutoff);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // storage quota exceeded — keep most recent 20 and retry
    const trimmed = fresh.slice(-20);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch {}
  }
}

export function loadGuestHistory() {
  return load();
}

/** Save or update a guest chat. Returns the chat object. */
export function saveGuestChat(chatId, messages) {
  const chats = load();
  const now = new Date().toISOString();
  const existing = chats.findIndex((c) => c.id === chatId);
  const chat = {
    id: chatId,
    messages: messages.map((m) => ({
      prompt: m.prompt,
      reply: m.reply,
      results: m.results,
      url: m.url,
      created_at: m.created_at || now,
    })),
    created_at: existing >= 0 ? chats[existing].created_at : now,
    updated_at: now,
  };
  if (existing >= 0) {
    chats[existing] = chat;
  } else {
    chats.unshift(chat);
  }
  persist(chats);
  return chat;
}

export function deleteGuestChat(chatId) {
  const chats = load().filter((c) => c.id !== chatId);
  persist(chats);
}