import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, Share2, Bell, BookOpen, Megaphone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  friend_request: UserPlus,
  message: Mail,
  reshare: Share2,
  blog: BookOpen,
  announcement: Megaphone
};

const colorMap: Record<string, string> = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  follow: 'text-emerald-500',
  friend_request: 'text-purple-500',
  message: 'text-primary',
  reshare: 'text-orange-500',
  blog: 'text-cyan-500',
  announcement: 'text-yellow-500'
};

interface NotificationsListProps {
  onClose?: () => void;
}

export function NotificationsList({ onClose }: NotificationsListProps) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {unreadCount > 0 && (
        <div className="p-2 border-b flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1 max-h-[400px]">
        <div className="divide-y">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type] || Bell;
            const iconColor = colorMap[notification.type] || 'text-muted-foreground';

            return (
              <div
                key={notification.id}
                className={cn(
                  'p-3 flex gap-3 hover:bg-muted/50 cursor-pointer transition-colors',
                  !notification.is_read && 'bg-primary/5'
                )}
                onClick={() => {
                  markAsRead(notification.id);
                  onClose?.();
                }}
              >
                <div className={cn('mt-0.5', iconColor)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm',
                    !notification.is_read && 'font-medium'
                  )}>
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
