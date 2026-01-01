import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentity } from '@/contexts/IdentityContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_user?: {
    id: string;
    display_name: string | null;
    unique_id: string | null;
    profile_photo_url: string | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export function useMessages() {
  const { profile } = useIdentity();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Fetch other user details and last message for each conversation
    const enrichedConversations = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.participant_1 === profile.id ? conv.participant_2 : conv.participant_1;
        
        const [userResult, messageResult, unreadResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, display_name, unique_id, profile_photo_url')
            .eq('id', otherUserId)
            .single(),
          supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', profile.id)
        ]);

        return {
          ...conv,
          other_user: userResult.data,
          last_message: messageResult.data,
          unread_count: unreadResult.count || 0
        };
      })
    );

    setConversations(enrichedConversations);
    setIsLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getOrCreateConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!profile?.id) return null;

    // Check existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${profile.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${profile.id})`)
      .single();

    if (existing) return existing.id;

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: profile.id,
        participant_2: otherUserId
      })
      .select('id')
      .single();

    if (error) {
      toast({ title: 'Failed to create conversation', variant: 'destructive' });
      return null;
    }

    return newConv.id;
  }, [profile?.id, toast]);

  return { conversations, isLoading, fetchConversations, getOrCreateConversation };
}

export function useConversation(conversationId: string | null) {
  const { profile } = useIdentity();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      
      // Mark messages as read
      if (profile?.id) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', profile.id)
          .eq('is_read', false);
      }
    }
    setIsLoading(false);
  }, [conversationId, profile?.id]);

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if not sender
          if (profile?.id && newMessage.sender_id !== profile.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages, profile?.id]);

  const sendMessage = useCallback(async (content: string | null, imageUrl: string | null) => {
    if (!conversationId || !profile?.id) return;
    if (!content && !imageUrl) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content,
        image_url: imageUrl
      });

    if (error) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
      return;
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

  }, [conversationId, profile?.id, toast]);

  return { messages, isLoading, sendMessage, refetch: fetchMessages };
}
