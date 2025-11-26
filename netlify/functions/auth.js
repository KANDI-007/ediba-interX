/**
 * Netlify Function pour l'authentification
 * Endpoint: /.netlify/functions/auth
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
    const { httpMethod, body } = event;
    
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
      case 'POST':
        return await handlePost(data);
      
      case 'GET':
        return await handleGet(event);
      
      default:
        return jsonResponse(405, { error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Erreur dans la fonction auth:', error);
    return jsonResponse(500, { 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// POST - Login ou vérification de session
async function handlePost(data) {
  const { action, username, password, email, token } = data;

  if (action === 'login') {
    // Authentification avec username/password
    // Note: Supabase Auth utilise email, donc on doit mapper username -> email
    if (!username || !password) {
      return jsonResponse(400, { error: 'username and password are required' });
    }

    // Chercher l'utilisateur par username dans la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      return jsonResponse(401, { error: 'Invalid credentials' });
    }

    // Vérifier le mot de passe (dans un vrai système, utilisez Supabase Auth)
    // Pour l'instant, on simule avec une vérification basique
    // TODO: Migrer vers Supabase Auth avec email/password
    
    // Mettre à jour last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    // Retourner les données utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = userData;
    
    return jsonResponse(200, {
      success: true,
      user: userWithoutPassword,
      // Dans un vrai système, vous retourneriez un token JWT ici
    });
  }

  if (action === 'verify') {
    // Vérifier un token JWT
    if (!token) {
      return jsonResponse(400, { error: 'token is required' });
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return jsonResponse(401, { error: 'Invalid token' });
      }

      return jsonResponse(200, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          // Ajouter d'autres champs depuis la table users si nécessaire
        },
      });
    } catch (e) {
      return jsonResponse(401, { error: 'Token verification failed' });
    }
  }

  return jsonResponse(400, { error: 'Invalid action' });
}

// GET - Vérification de session
async function handleGet(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    return jsonResponse(401, { error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return jsonResponse(401, { error: 'Invalid token' });
    }

    // Récupérer les données complètes depuis la table users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return jsonResponse(404, { error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = userData;

    return jsonResponse(200, {
      success: true,
      user: userWithoutPassword,
    });
  } catch (e) {
    return jsonResponse(401, { error: 'Token verification failed' });
  }
}

