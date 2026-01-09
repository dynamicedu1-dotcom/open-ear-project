import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  country?: string;
  region?: string;
  city?: string;
}

export const useVisitorTracking = () => {
  const [visitorCount, setVisitorCount] = useState(0);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [locationData, setLocationData] = useState<LocationData>({});

  useEffect(() => {
    // Fetch geolocation data using free IP API
    const fetchLocation = async () => {
      try {
        const response = await fetch('http://ip-api.com/json/?fields=status,country,regionName,city');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setLocationData({
              country: data.country,
              region: data.regionName,
              city: data.city,
            });
            return {
              country: data.country,
              region: data.regionName,
              city: data.city,
            };
          }
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
      return {};
    };

    const updatePresence = async (location: LocationData = {}) => {
      try {
        await supabase.from('active_visitors').upsert({
          session_id: sessionId,
          last_seen: new Date().toISOString(),
          page: window.location.pathname,
          country: location.country || locationData.country || null,
          region: location.region || locationData.region || null,
          city: location.city || locationData.city || null,
        }, {
          onConflict: 'session_id'
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    const cleanupStaleVisitors = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      try {
        await supabase
          .from('active_visitors')
          .delete()
          .lt('last_seen', fiveMinutesAgo);
      } catch (error) {
        console.error('Error cleaning up stale visitors:', error);
      }
    };

    const fetchVisitorCount = async () => {
      try {
        const { count } = await supabase
          .from('active_visitors')
          .select('*', { count: 'exact', head: true });
        setVisitorCount(count || 0);
      } catch (error) {
        console.error('Error fetching visitor count:', error);
      }
    };

    // Initial setup
    const init = async () => {
      const location = await fetchLocation();
      await updatePresence(location);
      await fetchVisitorCount();
      await cleanupStaleVisitors();
    };
    
    init();

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => updatePresence(), 30000);
    
    // Cleanup stale visitors every minute
    const cleanupInterval = setInterval(cleanupStaleVisitors, 60000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('active_visitors_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_visitors'
        },
        () => {
          fetchVisitorCount();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      clearInterval(presenceInterval);
      clearInterval(cleanupInterval);
      supabase.removeChannel(channel);
      
      // Remove this session
      supabase
        .from('active_visitors')
        .delete()
        .eq('session_id', sessionId)
        .then(() => {}, console.error);
    };
  }, [sessionId]);

  return visitorCount;
};
