/**
 * Configuration Supabase pour EDIBA INTER
 * 
 * Ce fichier configure le client Supabase pour l'application frontend.
 * Il utilise les variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  
  // En mode développement, on peut continuer avec des valeurs par défaut
  if (import.meta.env.DEV) {
    console.warn('⚠️ Mode développement: Supabase non configuré. Certaines fonctionnalités seront désactivées.');
  }
}

// Création du client Supabase
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'ediba-supabase-auth-token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-client-info': 'ediba-inter@1.0.0',
      },
    },
  }
);

// Types pour les tables Supabase (à mettre à jour selon votre schéma)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          full_name: string;
          role: 'admin' | 'comptable' | 'commercial' | 'lecture';
          avatar_url: string | null;
          phone: string | null;
          address: string | null;
          join_date: string;
          last_login: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          reply_to_id: string | null;
          is_edited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          name: string | null;
          is_group: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
    };
  };
}

// Helper pour vérifier la connexion Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (normal en dev)
      console.error('❌ Erreur de connexion Supabase:', error);
      return false;
    }
    console.log('✅ Connexion Supabase réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification Supabase:', error);
    return false;
  }
}

// Export du type pour utilisation dans d'autres fichiers
export type SupabaseClient = typeof supabase;

