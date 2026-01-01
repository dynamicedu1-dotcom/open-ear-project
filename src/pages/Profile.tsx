import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResponsiveLayout } from '@/layouts/ResponsiveLayout';
import { supabase } from '@/integrations/supabase/client';
import { useIdentity } from '@/contexts/IdentityContext';
import { useMessages } from '@/hooks/useMessages';
import { FollowButton } from '@/components/FollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, MapPin, Building, GraduationCap, Briefcase, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  display_name: string | null;
  unique_id: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  title: string | null;
  institute: string | null;
  job_role: string | null;
  profile_type: string | null;
  country: string | null;
  region: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
}

interface Voice {
  id: string;
  content: string;
  mood: string;
  category: string;
  likes_count: number;
  comment_count: number;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile: currentUser } = useIdentity();
  const { getOrCreateConversation } = useMessages();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, unique_id, profile_photo_url, bio, title, institute, job_role, profile_type, country, region, followers_count, following_count, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);

      // Fetch user's public voices
      const { data: voicesData } = await supabase
        .from('voices')
        .select('id, content, mood, category, likes_count, comment_count, created_at')
        .eq('user_profile_id', userId)
        .eq('is_anonymous', false)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);

      setVoices(voicesData || []);
      setIsLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const handleMessage = async () => {
    if (!userId) return;
    const conversationId = await getOrCreateConversation(userId);
    if (conversationId) {
      navigate(`/messages?conversation=${conversationId}`);
    }
  };

  if (isLoading) {
    return (
      <ResponsiveLayout>
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex gap-4 items-start">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  if (!profile) {
    return (
      <ResponsiveLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <Button variant="link" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="max-w-2xl mx-auto pb-20">
        {/* Header */}
        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-start">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.profile_photo_url || ''} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.[0] || profile.unique_id?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {profile.display_name || profile.unique_id}
              </h1>
              {profile.unique_id && profile.display_name && (
                <p className="text-muted-foreground text-sm">{profile.unique_id}</p>
              )}
              {profile.title && (
                <p className="text-sm text-muted-foreground mt-1">{profile.title}</p>
              )}
              <Badge variant="secondary" className="mt-2 capitalize">
                {profile.profile_type || 'user'}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold">{profile.followers_count || 0}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
            <div>
              <span className="font-bold">{profile.following_count || 0}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div>
              <span className="font-bold">{voices.length}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm">{profile.bio}</p>
          )}

          {/* Info Items */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {profile.institute && (
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {profile.institute}
              </div>
            )}
            {profile.job_role && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {profile.job_role}
              </div>
            )}
            {(profile.country || profile.region) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[profile.region, profile.country].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && currentUser && (
            <div className="flex gap-2">
              <FollowButton userId={profile.id} className="flex-1" />
              <Button variant="outline" className="flex-1" onClick={handleMessage}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="w-full justify-start px-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="p-4 space-y-3">
            {voices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No public posts yet
              </div>
            ) : (
              voices.map((voice) => (
                <Card key={voice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/wall`)}>
                  <CardContent className="p-4">
                    <p className="text-sm line-clamp-3">{voice.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{voice.likes_count} likes</span>
                      <span>{voice.comment_count} comments</span>
                      <span>{formatDistanceToNow(new Date(voice.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="about" className="p-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {profile.profile_type === 'student' ? (
                  <>
                    {profile.institute && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Institute</p>
                        <p className="font-medium">{profile.institute}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {profile.job_role && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Role</p>
                        <p className="font-medium">{profile.job_role}</p>
                      </div>
                    )}
                  </>
                )}
                {(profile.country || profile.region) && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Location</p>
                    <p className="font-medium">{[profile.region, profile.country].filter(Boolean).join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Member Since</p>
                  <p className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}
