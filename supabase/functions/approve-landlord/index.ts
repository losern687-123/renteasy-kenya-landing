import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveLandlordRequest {
  applicationId: string;
  approved: boolean;
  rejectionReason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { applicationId, approved, rejectionReason }: ApproveLandlordRequest = await req.json();
    
    console.log('Processing landlord application:', { applicationId, approved });

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('landlord_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error('Application not found');
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('landlord_applications')
      .update({
        status: approved ? 'approved' : 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      throw new Error('Failed to update application');
    }

    // If approved, update user role to landlord
    if (approved) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'landlord' })
        .eq('user_id', application.user_id);

      if (roleError) {
        console.error('Error updating user role:', roleError);
        throw new Error('Failed to update user role');
      }

      // Create notification for the user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'landlord_approved',
          message: 'Congratulations! Your landlord application has been approved. You can now access landlord features.',
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      console.log('User promoted to landlord successfully');
    } else {
      // Create rejection notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          type: 'landlord_rejected',
          message: `Your landlord application has been rejected. Reason: ${rejectionReason || 'Not specified'}`,
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: approved ? 'Landlord approved successfully' : 'Application rejected',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in approve-landlord function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An error occurred processing the request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
