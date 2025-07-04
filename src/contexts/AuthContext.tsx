import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Fetch user role from custom users table
          const { data: userData } = await supabase
            .from('users')
            .select('role, first_name, last_name, company_id')
            .eq('id', session.user.id)
            .single();
          
          // Merge role information into user object
          const userWithRole = {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              role: userData?.role,
              first_name: userData?.first_name,
              last_name: userData?.last_name,
              company_id: userData?.company_id
            }
          };
          setUser(userWithRole);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        // Fetch user role from custom users table
        const { data: userData } = await supabase
          .from('users')
          .select('role, first_name, last_name, company_id')
          .eq('id', session.user.id)
          .single();
        
        // Merge role information into user object
        const userWithRole = {
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            role: userData?.role,
            first_name: userData?.first_name,
            last_name: userData?.last_name,
            company_id: userData?.company_id
          }
        };
        setUser(userWithRole);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        if (errorMessage.toLowerCase().includes('invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect.';
        }
        return { error: { ...error, message: errorMessage } };
      }

      // Check if user is active after successful authentication
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_active, deleted_at')
          .eq('id', data.user.id)
          .single();

        if (userData && (!userData.is_active || userData.deleted_at)) {
          await supabase.auth.signOut();
          const message = userData.deleted_at ? 'Votre compte a été supprimé.' : 'Votre compte a été désactivé.';
          return { error: { message } };
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'Une erreur inattendue est survenue lors de la connexion.' } };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: string = 'client') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};