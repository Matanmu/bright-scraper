const { createClient } = require('@supabase/supabase-js');

function getClient(userToken = null) {
  if (!process.env.SUPABASE_URL) return { error: 'SUPABASE_URL is not set' };
  if (!process.env.SUPABASE_KEY) return { error: 'SUPABASE_KEY is not set' };

  const options = userToken
    ? { global: { headers: { Authorization: `Bearer ${userToken}` } } }
    : {};

  return { client: createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, options) };
}

async function createChat(firstMessage, userToken) {
  if (!firstMessage) return { error: 'First message is required' };
  if (!userToken) return { error: 'Auth required to save chat' };

  const { client, error } = getClient(userToken);
  if (error) return { error };

  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: 'Invalid or expired token' };

  const now = new Date().toISOString();
  const messages = [{ ...firstMessage, created_at: now }];

  const { data, error: dbError } = await client
    .from('scrape_history')
    .insert({ user_id: user.id, messages, created_at: now, updated_at: now })
    .select()
    .single();

  if (dbError) return { error: dbError.message };
  return { data };
}

async function appendMessage(chatId, message, userToken) {
  if (!chatId) return { error: 'Chat ID is required' };
  if (!message) return { error: 'Message is required' };
  if (!userToken) return { error: 'Auth required' };

  const { client, error } = getClient(userToken);
  if (error) return { error };

  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: 'Invalid or expired token' };

  // Fetch current messages
  const { data: existing, error: fetchError } = await client
    .from('scrape_history')
    .select('messages')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: 'Chat not found' };

  const now = new Date().toISOString();
  const updatedMessages = [...(existing.messages || []), { ...message, created_at: now }];

  const { data, error: updateError } = await client
    .from('scrape_history')
    .update({ messages: updatedMessages, updated_at: now })
    .eq('id', chatId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) return { error: updateError.message };
  return { data };
}

async function getHistory(userToken, limit = 20) {
  if (!userToken) return { error: 'Auth required' };

  const { client, error } = getClient(userToken);
  if (error) return { error };

  const { data, error: dbError } = await client
    .from('scrape_history')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (dbError) return { error: dbError.message };
  return { data };
}

async function deleteHistory(id, userToken) {
  if (!id) return { error: 'ID is required' };
  if (!userToken) return { error: 'Auth required' };

  const { client, error } = getClient(userToken);
  if (error) return { error };

  const { error: dbError } = await client
    .from('scrape_history')
    .delete()
    .eq('id', id);

  if (dbError) return { error: dbError.message };
  return { success: true };
}

module.exports = { createChat, appendMessage, getHistory, deleteHistory };
