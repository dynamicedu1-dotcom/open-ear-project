import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  is_anonymous: boolean;
  role: 'user' | 'core_team' | 'admin';
  is_blocked: boolean;
  created_at: string;
}

interface IdentityState {
  profile: UserProfile | null;
  isLoading: boolean;
  isIdentified: boolean;
  requiresIdentity: boolean;
}

const SESSION_TOKEN_KEY = 'dynamic_edu_session_token';

export function useIdentity() {
  const [state, setState] = useState<IdentityState>({
    profile: null,
    isLoading: true,
    isIdentified: false,
    requiresIdentity: false,
  });

  // Generate a secure random token
  const generateToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (storedToken) {
        // Try to find user by session token
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('session_token', storedToken)
          .single();

        if (data && !error) {
          setState({
            profile: data as UserProfile,
            isLoading: false,
            isIdentified: true,
            requiresIdentity: false,
          });
          return;
        }
      }

      // No valid session found
      setState(prev => ({
        ...prev,
        isLoading: false,
        isIdentified: false,
      }));
    };

    checkSession();
  }, []);

  // Create or update user profile
  const identify = useCallback(async (email: string, displayName?: string, isAnonymous: boolean = true) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingUser) {
        // Update existing user with new session token
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
        setState({
          profile: updatedUser as UserProfile,
          isLoading: false,
          isIdentified: true,
          requiresIdentity: false,
        });

        return { success: true, profile: updatedUser };
      }

      // Create new user
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
      setState({
        profile: newUser as UserProfile,
        isLoading: false,
        isIdentified: true,
        requiresIdentity: false,
      });

      return { success: true, profile: newUser };
    } catch (error: any) {
      console.error('Identity error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message };
    }
  }, []);

  // Trigger identity modal
  const requestIdentity = useCallback(() => {
    setState(prev => ({ ...prev, requiresIdentity: true }));
  }, []);

  // Close identity modal without identifying
  const cancelIdentityRequest = useCallback(() => {
    setState(prev => ({ ...prev, requiresIdentity: false }));
  }, []);

  // Clear session (logout)
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setState({
      profile: null,
      isLoading: false,
      isIdentified: false,
      requiresIdentity: false,
    });
  }, []);

  // Get display name for UI
  const getDisplayName = useCallback(() => {
    if (!state.profile) return 'Anonymous';
    if (state.profile.is_anonymous) return state.profile.display_name || 'Anonymous';
    return state.profile.display_name || state.profile.email.split('@')[0];
  }, [state.profile]);

  return {
    ...state,
    identify,
    requestIdentity,
    cancelIdentityRequest,
    clearSession,
    getDisplayName,
  };
}
