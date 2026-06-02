import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: { display_name: string | null; avatar_url: string | null } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  profile: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  useEffect(() => {
    const wpCfg = (window as any)?.versace22_chat;
    if (wpCfg) {
      const isLoggedIn = !!wpCfg.user_logged_in;
      setSession(null);
      setUser(
        isLoggedIn
          ? ({
              id: String(wpCfg.user_id || 'wp-user'),
              email: wpCfg.user_email || undefined,
              created_at: new Date().toISOString(),
            } as User)
          : null,
      );
      setProfile({
        display_name: isLoggedIn ? wpCfg.user_display_name || 'User' : null,
        avatar_url: wpCfg.user_avatar || null,
      });
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) setProfile(data);
            });
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const wpCfg = (window as any)?.versace22_chat;
    if (wpCfg?.logout_url) {
      window.location.href = wpCfg.logout_url;
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
