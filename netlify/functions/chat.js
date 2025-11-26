/**
 * Netlify Function pour la gestion du chat
 * Endpoint: /.netlify/functions/chat
 */

const { createClient } = require('@supabase/supabase-js');

// Initialisation du client Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes pour les fonctions');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper pour les réponses
const jsonResponse = (statusCode, data) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  },
  body: JSON.stringify(data),
});

// Handler principal
exports.handler = async (event, context) => {
  // Gestion CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  try {
    const { httpMethod, path, body, queryStringParameters } = event;
    const route = path.split('/').pop() || 'messages';
    
    // Parse du body si présent
    let data = {};
    if (body) {
      try {
        data = JSON.parse(body);
      } catch (e) {
        return jsonResponse(400, { error: 'Invalid JSON body' });
      }
    }

    // Récupération de l'utilisateur depuis le token (si authentification)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      } catch (e) {
        console.error('Erreur authentification:', e);
      }
    }

    // Routes
    switch (httpMethod) {
      case 'GET':
        return await handleGet(route, queryStringParameters, userId);
      
      case 'POST':
        return await handlePost(route, data, userId);
      
      case 'PUT':
        return await handlePut(route, data, userId);
      
      case 'DELETE':
        return await handleDelete(route, queryStringParameters, userId);
      
      default:
        return jsonResponse(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Erreur dans la fonction chat:', error);
    return jsonResponse(500, { 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// GET - Récupération des messages/conversations
async function handleGet(route, query, userId) {
  if (route === 'messages' || route === 'chat') {
    const { conversationId, limit = 50, offset = 0 } = query || {};
    
    if (!conversationId) {
      return jsonResponse(400, { error: 'conversationId is required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users:users!sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    return jsonResponse(200, { messages: data || [] });
  }

  if (route === 'conversations') {
    if (!userId) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    // Récupérer les conversations de l'utilisateur
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations (
          id,
          name,
          is_group,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    return jsonResponse(200, { conversations: data || [] });
  }

  return jsonResponse(404, { error: 'Route not found' });
}

// POST - Envoi de message ou création de conversation
async function handlePost(route, data, userId) {
  if (!userId) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  if (route === 'messages' || route === 'chat') {
    const { conversationId, content, messageType = 'text', fileUrl, fileName, fileSize, replyToId } = data;

    if (!conversationId || !content) {
      return jsonResponse(400, { error: 'conversationId and content are required' });
    }

    // Vérifier que l'utilisateur est participant
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (participantError || !participant) {
      return jsonResponse(403, { error: 'Access denied to this conversation' });
    }

    // Insérer le message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        reply_to_id: replyToId,
      }])
      .select(`
        *,
        users:users!sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    // Mettre à jour la date de modification de la conversation
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return jsonResponse(201, { message });
  }

  if (route === 'conversations') {
    const { participants, isGroup = false, name } = data;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return jsonResponse(400, { error: 'participants array is required' });
    }

    // Créer la conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        name: name || null,
        is_group: isGroup,
        created_by: userId,
      }])
      .select()
      .single();

    if (convError) {
      return jsonResponse(500, { error: convError.message });
    }

    // Ajouter les participants
    const participantsData = [...new Set([userId, ...participants])].map(pid => ({
      conversation_id: conversation.id,
      user_id: pid,
    }));

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participantsData);

    if (partError) {
      return jsonResponse(500, { error: partError.message });
    }

    return jsonResponse(201, { conversation });
  }

  return jsonResponse(404, { error: 'Route not found' });
}

// PUT - Mise à jour (marquer comme lu, etc.)
async function handlePut(route, data, userId) {
  if (!userId) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  // Marquer les messages comme lus
  if (route === 'read' || data.action === 'mark_read') {
    const { messageIds, conversationId } = data;

    // Ici, vous pouvez implémenter une table message_reads si nécessaire
    // Pour l'instant, on retourne juste un succès
    return jsonResponse(200, { success: true, message: 'Messages marked as read' });
  }

  return jsonResponse(404, { error: 'Route not found' });
}

// DELETE - Suppression
async function handleDelete(route, query, userId) {
  if (!userId) {
    return jsonResponse(401, { error: 'Unauthorized' });
  }

  const { messageId } = query || {};

  if (route === 'messages' && messageId) {
    // Vérifier que le message appartient à l'utilisateur
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return jsonResponse(404, { error: 'Message not found' });
    }

    if (message.sender_id !== userId) {
      return jsonResponse(403, { error: 'You can only delete your own messages' });
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    return jsonResponse(200, { success: true });
  }

  return jsonResponse(404, { error: 'Route not found' });
}

