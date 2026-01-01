import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIdentity } from '@/contexts/IdentityContext';
import { useToast } from '@/hooks/use-toast';

export function useFollow(targetUserId: string | null) {
  const { profile } = useIdentity();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id || !targetUserId) return;

    const checkFollowStatus = async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', profile.id)
        .eq('following_id', targetUserId)
        .single();

      setIsFollowing(!!data);
    };

    checkFollowStatus();
  }, [profile?.id, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (!profile?.id || !targetUserId) {
      toast({ title: 'Please identify yourself first', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', profile.id)
          .eq('following_id', targetUserId);
        setIsFollowing(false);
        toast({ title: 'Unfollowed successfully' });
      } else {
        await supabase
          .from('user_follows')
          .insert({ follower_id: profile.id, following_id: targetUserId });
        setIsFollowing(true);
        toast({ title: 'Following!' });

        // Create notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'follow',
          title: 'New follower',
          body: `${profile.display_name || profile.unique_id} started following you`,
          data: { follower_id: profile.id }
        });
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast({ title: 'Failed to update follow status', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [profile, targetUserId, isFollowing, toast]);

  return { isFollowing, isLoading, toggleFollow };
}
