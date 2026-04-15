import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type UserRole = 'tenant' | 'landlord' | 'admin' | 'property_seeker';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  landlordStatus: 'pending' | 'approved' | 'rejected' | null;
  isApprovedLandlord: boolean;
  signUp: (email: string, password: string, name: string, role: 'tenant' | 'landlord' | 'property_seeker', nationalId?: string, landlordCode?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshLandlordStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [landlordStatus, setLandlordStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLandlordStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('landlord_applications')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching landlord status:', error);
      setLandlordStatus(null);
      return;
    }
    
    if (data) {
      setLandlordStatus(data.status as 'pending' | 'approved' | 'rejected');
    } else {
      setLandlordStatus('pending');
    }
  };

  const refreshLandlordStatus = async () => {
    if (user) {
      await fetchLandlordStatus(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
              setUserRole(data.role as UserRole);
              if (data.role === 'landlord') {
                await fetchLandlordStatus(session.user.id);
              }
            }
          }, 0);
        } else {
          setUserRole(null);
          setLandlordStatus(null);
        }
        
        setLoading(false);
      }
    );

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
             setUserRole(data.role as UserRole);
             if (data.role === 'landlord') {
               await fetchLandlordStatus(session.user.id);
             }
          }
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isApprovedLandlord = userRole === 'landlord' && landlordStatus === 'approved';

  const signUp = async (email: string, password: string, name: string, role: 'tenant' | 'landlord' | 'property_seeker', nationalId?: string, landlordCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role,
        }
      }
    });

    if (!error && data.user) {
      // If landlord role, create a pending application row for admin to review
      if (role === 'landlord') {
        await supabase
          .from('landlord_applications')
          .insert({
            user_id: data.user.id,
            national_id: nationalId || 'PENDING',
            kra_pin: '',
            status: 'pending'
          });
      }

      // If tenant with a landlord code, validate and link
      if (role === 'tenant' && landlordCode) {
        const { data: validationResult } = await supabase.rpc('validate_landlord_id', {
          p_landlord_id: landlordCode
        });

        if (validationResult) {
          // Get landlord's user ID from the landlord_id
          const { data: landlordProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('landlord_id', landlordCode)
            .maybeSingle();

          if (landlordProfile) {
            await supabase
              .from('tenants')
              .upsert({
                id: data.user.id,
                landlord_id: landlordProfile.id,
              });
          }
        }
      }

      toast({
        title: "Account created!",
        description: "Welcome to RentEasy Kenya",
      });
      
      setTimeout(() => {
        if (role === 'tenant') {
          navigate('/tenant-dashboard');
        } else if (role === 'property_seeker') {
          navigate('/seeker/dashboard');
        } else {
          navigate('/landlord/pending');
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
      const [roleResponse, profileResponse, applicationResponse] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', data.user.id).single(),
        supabase.from('profiles').select('name').eq('id', data.user.id).single(),
        supabase.from('landlord_applications').select('status').eq('user_id', data.user.id).maybeSingle()
      ]);

      if (roleResponse.data) {
        const role = roleResponse.data.role as UserRole;
        const userName = profileResponse.data?.name || 'User';
        const applicationStatus = (applicationResponse.data?.status as 'pending' | 'approved' | 'rejected') || 'pending';
        
        const createdAt = new Date(data.user.created_at).getTime();
        const lastSignIn = new Date(data.user.last_sign_in_at || data.user.created_at).getTime();
        const isFirstLogin = (lastSignIn - createdAt) < 60000;
        
        toast({
          title: isFirstLogin ? `Welcome ${userName}!` : "Welcome back!",
          description: `Logged in as ${role}`,
        });
        
        setTimeout(() => {
          if (role === 'admin') {
            navigate('/admin/dashboard');
          } else if (role === 'tenant') {
            navigate('/tenant-dashboard');
          } else if (role === 'property_seeker') {
            navigate('/seeker/dashboard');
          } else if (role === 'landlord') {
            if (applicationStatus === 'approved') {
              navigate('/landlord-dashboard');
            } else if (applicationStatus === 'rejected') {
              navigate('/landlord/rejected');
            } else {
              navigate('/landlord/pending');
            }
          }
        }, 500);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setLandlordStatus(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userRole, 
      landlordStatus,
      isApprovedLandlord,
      signUp, 
      signIn, 
      signOut, 
      loading,
      refreshLandlordStatus
    }}>
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
