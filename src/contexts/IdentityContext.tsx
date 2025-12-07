import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  unique_id: string | null;
  is_anonymous: boolean;
  role: 'user' | 'core_team' | 'admin';
  is_blocked: boolean;
  created_at: string;
}

interface IdentityContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isIdentified: boolean;
  requiresIdentity: boolean;
  identify: (email: string, displayName?: string, isAnonymous?: boolean) => Promise<{ success: boolean; profile?: any; error?: string }>;
  requestIdentity: () => void;
  cancelIdentityRequest: () => void;
  clearSession: () => void;
  getDisplayName: () => string;
  getUserId: () => string | null;
  refreshProfile: () => Promise<void>;
}

const SESSION_TOKEN_KEY = 'dynamic_edu_session_token';

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresIdentity, setRequiresIdentity] = useState(false);

  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const checkSession = useCallback(async () => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (storedToken) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('session_token', storedToken)
          .single();

        if (data && !error) {
          setProfile(data as UserProfile);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    }

    setProfile(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const refreshProfile = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  const identify = useCallback(async (email: string, displayName?: string, isAnonymous: boolean = true) => {
    setIsLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingUser) {
        const newToken = generateToken();
        const { data: updatedUser, error } = await supabase
          .from('user_profiles')
          .update({ 
            session_token: newToken,
            display_name: displayName || existingUser.display_name,
            is_anonymous: isAnonymous,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (error) throw error;

        localStorage.setItem(SESSION_TOKEN_KEY, newToken);
        setProfile(updatedUser as UserProfile);
        setIsLoading(false);
        setRequiresIdentity(false);

        return { success: true, profile: updatedUser };
      }

      const newToken = generateToken();
      const { data: newUser, error } = await supabase
        .from('user_profiles')
        .insert({
          email: email.toLowerCase().trim(),
          display_name: displayName || null,
          is_anonymous: isAnonymous,
          session_token: newToken,
          role: 'user',
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem(SESSION_TOKEN_KEY, newToken);
      setProfile(newUser as UserProfile);
      setIsLoading(false);
      setRequiresIdentity(false);

      return { success: true, profile: newUser };
    } catch (error: any) {
      console.error('Identity error:', error);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  }, []);

  const requestIdentity = useCallback(() => {
    setRequiresIdentity(true);
  }, []);

  const cancelIdentityRequest = useCallback(() => {
    setRequiresIdentity(false);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setProfile(null);
    setRequiresIdentity(false);
  }, []);

  const getDisplayName = useCallback(() => {
    if (!profile) return 'Anonymous';
    if (profile.is_anonymous) {
      return profile.unique_id || profile.display_name || 'Anonymous';
    }
    return profile.display_name || profile.unique_id || profile.email.split('@')[0];
  }, [profile]);

  const getUserId = useCallback(() => {
    return profile?.unique_id || null;
  }, [profile]);

  const value: IdentityContextType = {
    profile,
    isLoading,
    isIdentified: !!profile,
    requiresIdentity,
    identify,
    requestIdentity,
    cancelIdentityRequest,
    clearSession,
    getDisplayName,
    getUserId,
    refreshProfile,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}
