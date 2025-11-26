/**
 * Service de gestion du chat avec Supabase
 * Gère la sauvegarde et la récupération des messages depuis Supabase
 */

import { supabase } from '../lib/supabase';
import type { ChatMessage, ChatConversation } from '../contexts/ChatContextProduction';

export interface SupabaseMessage {
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
}

export interface SupabaseConversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Sauvegarde un message dans Supabase
 */
export async function saveMessageToSupabase(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text',
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  replyToId?: string
): Promise<SupabaseMessage | null> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_size: fileSize || null,
          reply_to_id: replyToId || null,
          is_edited: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la sauvegarde du message:', error);
      return null;
    }

    // Mettre à jour la date de modification de la conversation
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('✅ Message sauvegardé dans Supabase:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du message:', error);
    return null;
  }
}

/**
 * Récupère les messages d'une conversation depuis Supabase
 */
export async function getMessagesFromSupabase(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<SupabaseMessage[]> {
  try {
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
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erreur lors de la récupération des messages:', error);
      return [];
    }

    return (data as any) || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error);
    return [];
  }
}

/**
 * Crée ou récupère une conversation
 */
export async function getOrCreateConversation(
  participants: string[],
  isGroup: boolean = false,
  name?: string
): Promise<string | null> {
  try {
    // Vérifier si une conversation existe déjà avec ces participants
    if (!isGroup && participants.length === 2) {
      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('user_id', participants)
        .eq('conversation_id', (await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('user_id', participants)
          .limit(1)
        ).data?.[0]?.conversation_id || '');

      // Logique simplifiée : créer une nouvelle conversation
      // TODO: Implémenter la logique de recherche de conversation existante
    }

    // Créer une nouvelle conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert([
        {
          name: name || null,
          is_group: isGroup,
          created_by: participants[0],
        },
      ])
      .select()
      .single();

    if (convError || !conversation) {
      console.error('❌ Erreur lors de la création de la conversation:', convError);
      return null;
    }

    // Ajouter les participants
    const participantsData = participants.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
    }));

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participantsData);

    if (partError) {
      console.error('❌ Erreur lors de l\'ajout des participants:', partError);
      // Ne pas retourner null, la conversation est créée
    }

    return conversation.id;
  } catch (error) {
    console.error('❌ Erreur lors de la création/récupération de la conversation:', error);
    return null;
  }
}

/**
 * Récupère les conversations d'un utilisateur
 */
export async function getUserConversations(userId: string): Promise<SupabaseConversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations (
          id,
          name,
          is_group,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erreur lors de la récupération des conversations:', error);
      return [];
    }

    return (data as any)?.map((item: any) => item.conversations).filter(Boolean) || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des conversations:', error);
    return [];
  }
}

/**
 * Convertit un message Supabase en format ChatMessage
 */
export function convertSupabaseMessageToChatMessage(
  supabaseMessage: SupabaseMessage & { users?: any }
): ChatMessage {
  return {
    id: supabaseMessage.id,
    senderId: supabaseMessage.sender_id,
    senderName: supabaseMessage.users?.full_name || supabaseMessage.users?.username || 'Unknown',
    content: supabaseMessage.content,
    timestamp: supabaseMessage.created_at,
    conversationId: supabaseMessage.conversation_id,
    type: supabaseMessage.message_type,
    isDelivered: true,
    isRead: false,
    replyTo: supabaseMessage.reply_to_id || undefined,
  };
}

/**
 * Écoute les nouveaux messages en temps réel via Supabase Realtime
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: SupabaseMessage) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as SupabaseMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

