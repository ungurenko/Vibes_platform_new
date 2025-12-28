import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkInvite, useInvite, completeOnboardingDB } from '../lib/supabase';
import { Student, InviteLink } from '../types';

interface AuthContextType {
  session: any | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; avatar?: string; password?: string }, inviteCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  validateInvite: (code: string) => Promise<InviteLink | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchProfile(session.user.id);
      } else {
          setProfile(null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (data) {
            if (data.is_banned) {
                await supabase.auth.signOut();
                setSession(null);
                setProfile(null);
                alert("Ваш аккаунт заблокирован администратором.");
                return;
            }
            setProfile(data);
        }
      } catch (e) {
          console.error("Profile fetch error", e);
      } finally {
          setLoading(false);
      }
  };

  const login = async (email: string, password: string) => {
      // Check if Supabase is actually configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
          const msg = "Ошибка конфигурации: Не заданы переменные окружения VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY на Vercel.";
          alert(msg);
          throw new Error(msg);
      }

      try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
      } catch (e: any) {
          const isQuotaError = e.name === 'QuotaExceededError' || 
                               e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                               e.message?.toLowerCase().includes('quota') ||
                               e.message?.toLowerCase().includes('exceeded');

          if (isQuotaError) {
              console.warn("Storage quota exceeded. Attempting aggressive cleanup...");
              try {
                  const theme = localStorage.getItem('theme');
                  localStorage.clear();
                  if (theme) localStorage.setItem('theme', theme);
                  
                  const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
                  if (retryError) throw retryError;
              } catch (retryE: any) {
                   const msg = "Не удалось войти из-за ограничений памяти браузера (Инкогнито или диск заполнен).";
                   alert(msg);
                   throw new Error(msg);
              }
          } else {
              throw e;
          }
      }
  };

  const register = async (data: { name: string; email: string; avatar?: string; password?: string }, inviteCode?: string) => {
      const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password || '',
          options: {
              data: {
                  full_name: data.name,
                  avatar_url: data.avatar
              }
          }
      });

      if (error) {
          throw error;
      } else {
          if (inviteCode) {
              await useInvite(inviteCode, data.email);
          }
          // Profile creation is handled by Supabase Trigger usually, or we wait for fetchProfile
      }
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
  };

  const completeOnboarding = async () => {
      if (session?.user?.id) {
          await completeOnboardingDB(session.user.id);
          await fetchProfile(session.user.id);
      }
  };

  const validateInvite = async (code: string): Promise<InviteLink | null> => {
      const inviteData = await checkInvite(code);
      if (!inviteData) return null;
      return {
          id: inviteData.id,
          token: inviteData.token,
          status: inviteData.status,
          created: inviteData.created_at,
          expiresAt: inviteData.expires_at
      };
  };

  return (
    <AuthContext.Provider value={{ 
        session, 
        profile, 
        loading, 
        isAdmin: profile?.is_admin || false,
        login, 
        register, 
        logout,
        completeOnboarding,
        validateInvite
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
