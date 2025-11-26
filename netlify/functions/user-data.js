/**
 * Netlify Function pour la gestion des données utilisateur
 * Endpoint: /.netlify/functions/user-data
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

// Helper pour vérifier l'authentification
async function getAuthenticatedUser(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return { error: 'Unauthorized', user: null };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid token', user: null };
    }

    return { error: null, user };
  } catch (e) {
    return { error: 'Token verification failed', user: null };
  }
}

// Handler principal
exports.handler = async (event, context) => {
  // Gestion CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  try {
    const { httpMethod, body, queryStringParameters } = event;
    
    // Vérification de l'authentification
    const { error: authError, user } = await getAuthenticatedUser(event);
    if (authError || !user) {
      return jsonResponse(401, { error: authError || 'Unauthorized' });
    }

    // Parse du body
    let data = {};
    if (body) {
      try {
        data = JSON.parse(body);
      } catch (e) {
        return jsonResponse(400, { error: 'Invalid JSON body' });
      }
    }

    switch (httpMethod) {
      case 'GET':
        return await handleGet(user.id, queryStringParameters);
      
      case 'POST':
        return await handlePost(user.id, data);
      
      case 'PUT':
        return await handlePut(user.id, data);
      
      case 'DELETE':
        return await handleDelete(user.id, queryStringParameters);
      
      default:
        return jsonResponse(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Erreur dans la fonction user-data:', error);
    return jsonResponse(500, { 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// GET - Récupération des données utilisateur
async function handleGet(userId, query) {
  const { type } = query || {};

  if (type === 'profile') {
    // Récupérer le profil utilisateur
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const { password: _, ...userWithoutPassword } = data || {};
    return jsonResponse(200, { user: userWithoutPassword });
  }

  // Par défaut, retourner le profil
  return await handleGet(userId, { type: 'profile' });
}

// POST - Création de données utilisateur
async function handlePost(userId, data) {
  // Cette fonction peut être utilisée pour créer des préférences utilisateur, etc.
  // Pour l'instant, on retourne une erreur
  return jsonResponse(400, { error: 'POST not implemented for this endpoint' });
}

// PUT - Mise à jour des données utilisateur
async function handlePut(userId, data) {
  const { fullName, email, phone, address, avatarUrl, role } = data;

  // Construire l'objet de mise à jour
  const updateData = {};
  if (fullName !== undefined) updateData.full_name = fullName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
  if (role !== undefined) updateData.role = role;
  
  updateData.updated_at = new Date().toISOString();

  if (Object.keys(updateData).length === 1) { // Seulement updated_at
    return jsonResponse(400, { error: 'No fields to update' });
  }

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  const { password: _, ...userWithoutPassword } = updatedUser;
  return jsonResponse(200, { user: userWithoutPassword });
}

// DELETE - Suppression (désactivation) de l'utilisateur
async function handleDelete(userId, query) {
  // Au lieu de supprimer, on désactive l'utilisateur
  const { data, error } = await supabase
    .from('users')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  return jsonResponse(200, { 
    success: true, 
    message: 'User deactivated',
    user: data 
  });
}

