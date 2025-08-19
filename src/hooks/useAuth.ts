
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Inicializando autenticação...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔐 Password recovery detected, redirecting...');
          // Set a flag to show password reset form
          sessionStorage.setItem('password-recovery', 'true');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Session check:', session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Tentando login para:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('🔐 Erro no login:', error.message);
    } else {
      console.log('🔐 Login bem-sucedido:', data.user?.email);
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('🔐 Tentando cadastro para:', email);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('🔐 Erro no cadastro:', error.message);
    } else {
      console.log('🔐 Cadastro processado:', data.user?.email);
      // Se o usuário já existe, o Supabase retorna sem error mas com user null
      if (!data.user && !error) {
        console.log('🔐 Usuário já existe no sistema');
        return { 
          error: { 
            message: 'User already registered',
            status: 400 
          }
        };
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🔐 Fazendo logout...');
    await supabase.auth.signOut();
    console.log('🔐 Logout realizado');
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
