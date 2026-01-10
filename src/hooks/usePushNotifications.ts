import { useState, useEffect, useCallback } from 'react';
import { useIdentity } from '@/contexts/IdentityContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { profile } = useIdentity();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if browser supports notifications
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsSubscribed(true);
        toast.success('Push notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    try {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  // Subscribe to realtime notifications and show browser notifications
  useEffect(() => {
    if (!profile?.id || permission !== 'granted') return;

    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const notification = payload.new as {
            title: string;
            body: string | null;
            type: string;
          };
          
          // Show browser notification
          showNotification(notification.title, {
            body: notification.body || undefined,
            tag: `notification-${payload.new.id}`,
            requireInteraction: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, permission, showNotification]);

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    showNotification,
  };
}

// Helper to create notifications in the database
export async function createNotification(
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system',
  title: string,
  body?: string,
  data?: Record<string, any>
) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      data: data || {},
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}
