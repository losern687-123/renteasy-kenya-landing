import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyLandlordRequest {
  userId: string;
  approved: boolean;
  rejectionReason?: string;
  userName?: string;
  userEmail?: string;
  landlordId?: string;
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

    const { userId, approved, rejectionReason, userName, userEmail, landlordId }: NotifyLandlordRequest = await req.json();
    
    console.log('Sending landlord notification email:', { userId, approved, userEmail, landlordId });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    if (!userEmail) {
      throw new Error('User email is required');
    }

    let emailHtml: string;
    let subject: string;

    if (approved) {
      subject = "🎉 You're Now a Verified Landlord on RentEasy Kenya";
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .landlord-id { background: white; padding: 20px; border: 2px solid #667eea; border-radius: 8px; text-align: center; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations!</h1>
              </div>
              <div class="content">
                <h2>Welcome to RentEasy Kenya, ${userName || 'Landlord'}!</h2>
                <p>We're excited to inform you that your landlord application has been <strong>approved</strong>!</p>
                
                <div class="landlord-id">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your Unique Landlord ID:</p>
                  <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: bold; color: #667eea;">${landlordId || 'N/A'}</p>
                </div>
                
                <p><strong>Important:</strong> Share this Landlord ID with your tenants so they can link their accounts to you during registration.</p>
                
                <p>You can now access all landlord features including:</p>
                <ul>
                  <li>Property management</li>
                  <li>Tenant management</li>
                  <li>Payment tracking</li>
                  <li>Activity monitoring</li>
                </ul>
                <p>Click the button below to access your landlord dashboard:</p>
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://renteasy.lovable.app'}/landlord-dashboard" class="button">
                  Go to Landlord Dashboard
                </a>
                <p style="margin-top: 30px;">Thank you for choosing RentEasy Kenya!</p>
              </div>
              <div class="footer">
                <p>RentEasy Kenya - Simplifying Property Management</p>
                <p>If you have any questions, please contact our support team.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = "Update on Your RentEasy Landlord Application";
      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .reason { background: #fff; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Application Update</h1>
              </div>
              <div class="content">
                <h2>Hello ${userName || 'Applicant'},</h2>
                <p>Thank you for your interest in becoming a landlord on RentEasy Kenya.</p>
                <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
                ${rejectionReason ? `
                  <div class="reason">
                    <strong>Reason:</strong><br/>
                    ${rejectionReason}
                  </div>
                ` : ''}
                <p>If you believe this decision was made in error or if you have additional information that may help your application, please don't hesitate to reach out to our support team.</p>
                <a href="mailto:support@renteasy.co.ke" class="button">
                  Contact Support
                </a>
                <p style="margin-top: 30px;">We appreciate your understanding.</p>
              </div>
              <div class="footer">
                <p>RentEasy Kenya - Simplifying Property Management</p>
                <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "RentEasy Kenya <noreply@renteasy.co.ke>",
      to: [userEmail],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    const emailId = (emailResponse as any)?.data?.id || (emailResponse as any)?.id || 'unknown';

    // Log email activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: approved ? 'landlord_approval_email_sent' : 'landlord_rejection_email_sent',
        entity_type: 'email_notification',
        entity_id: emailId,
        details: {
          email: userEmail,
          approved,
          landlordId,
          sent_at: new Date().toISOString(),
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: emailId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in notify-landlord function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send email notification'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
