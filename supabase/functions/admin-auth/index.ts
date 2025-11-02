import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminAuthRequest {
  email: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: AdminAuthRequest = await req.json();
    
    console.log('Admin authentication attempt for:', email);

    // Get admin credentials from environment
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      throw new Error('Admin credentials not configured');
    }

    // Validate credentials
    if (email !== adminEmail || password !== adminPassword) {
      console.log('Invalid admin credentials');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid admin credentials'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Authenticate with Supabase using admin credentials
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find or create admin user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users:', authError);
      throw new Error('Authentication failed');
    }

    let adminUser = authData.users.find(u => u.email === adminEmail);

    if (!adminUser) {
      // Create admin user if doesn't exist
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        throw new Error('Failed to create admin user');
      }

      adminUser = newUser.user;

      // Set admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: adminUser.id, role: 'admin' });

      if (roleError) {
        console.error('Error setting admin role:', roleError);
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          id: adminUser.id, 
          name: 'Administrator', 
          email: adminEmail 
        });

      if (profileError) {
        console.error('Error creating admin profile:', profileError);
      }
    }

    // Sign in admin user to get session token
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (signInError) {
      console.error('Error signing in admin:', signInError);
      throw new Error('Failed to authenticate admin');
    }

    console.log('Admin authenticated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        user: sessionData.user,
        session: sessionData.session,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in admin-auth function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An error occurred during authentication'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
