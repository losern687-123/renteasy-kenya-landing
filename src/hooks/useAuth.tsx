import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'tenant' | 'landlord' | 'admin' | null;
  signUp: (email: string, password: string, name: string, role: 'tenant' | 'landlord') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'tenant' | 'landlord' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when authenticated
        if (session?.user) {
          setTimeout(async () => {
            const { data } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            if (data) {
              setUserRole(data.role as 'tenant' | 'landlord' | 'admin');
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (data) {
            setUserRole(data.role as 'tenant' | 'landlord' | 'admin');
          }
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'tenant' | 'landlord') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role
        }
      }
    });

    if (!error && data.user) {
      toast({
        title: "Account created!",
        description: "Welcome to RentEasy Kenya",
      });
      
      // Redirect based on role
      setTimeout(() => {
        if (role === 'tenant') {
          navigate('/tenant-dashboard');
        } else {
          navigate('/landlord-dashboard');
        }
      }, 500);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      // Fetch role and profile to redirect appropriately
      const [roleResponse, profileResponse] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', data.user.id).single(),
        supabase.from('profiles').select('name').eq('id', data.user.id).single()
      ]);

      if (roleResponse.data) {
        const role = roleResponse.data.role as 'tenant' | 'landlord' | 'admin';
        const userName = profileResponse.data?.name || 'User';
        
        // Check if this is first login by comparing created_at and last_sign_in_at
        const createdAt = new Date(data.user.created_at).getTime();
        const lastSignIn = new Date(data.user.last_sign_in_at || data.user.created_at).getTime();
        const isFirstLogin = (lastSignIn - createdAt) < 60000; // Within 1 minute of account creation
        
        toast({
          title: isFirstLogin ? `Welcome ${userName}!` : "Welcome back!",
          description: `Logged in as ${role}`,
        });
        
        setTimeout(() => {
          if (role === 'admin') {
            navigate('/admin/dashboard');
          } else if (role === 'tenant') {
            navigate('/tenant-dashboard');
          } else {
            navigate('/landlord-dashboard');
          }
        }, 500);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
