import React from 'react';
import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/useFollow';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function FollowButton({ 
  userId, 
  className, 
  variant = 'default',
  size = 'sm',
  showIcon = true 
}: FollowButtonProps) {
  const { isFollowing, isLoading, toggleFollow } = useFollow(userId);

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        toggleFollow();
      }}
      disabled={isLoading}
      className={cn(
        isFollowing && 'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (isFollowing ? <UserMinus className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />)}
          {isFollowing ? 'Unfollow' : 'Follow'}
        </>
      )}
    </Button>
  );
}
