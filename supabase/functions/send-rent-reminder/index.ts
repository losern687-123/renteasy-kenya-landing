import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RentReminderRequest {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  dueDate: string;
  isOverdue: boolean;
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Input validation
function validateReminderInput(data: RentReminderRequest): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!data.tenantEmail || !emailRegex.test(data.tenantEmail)) {
    return { valid: false, error: "Invalid tenant email" };
  }
  
  if (!data.tenantName || data.tenantName.length > 100) {
    return { valid: false, error: "Invalid tenant name" };
  }
  
  if (!data.propertyName || data.propertyName.length > 200) {
    return { valid: false, error: "Invalid property name" };
  }
  
  // Check for header injection attempts
  const headerInjectionPattern = /[\r\n]/;
  if (headerInjectionPattern.test(data.tenantEmail) || 
      headerInjectionPattern.test(data.tenantName) || 
      headerInjectionPattern.test(data.propertyName)) {
    return { valid: false, error: "Invalid characters detected" };
  }
  
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify user has landlord role
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'landlord' });
    
    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Landlord access required' }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const requestData: RentReminderRequest = await req.json();

    // Validate input
    const validation = validateReminderInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const {
      tenantEmail,
      tenantName,
      propertyName,
      dueDate,
      isOverdue,
    } = requestData;

    // Sanitize for logging
    console.log("Rent reminder request:", { 
      landlordId: user.id,
      tenantEmail: tenantEmail.substring(0, 20) + "...",
      isOverdue 
    });

    // Escape HTML to prevent XSS
    const safeTenantName = escapeHtml(tenantName.trim());
    const safePropertyName = escapeHtml(propertyName.trim());
    const safeDueDate = escapeHtml(dueDate.trim());

    const subject = isOverdue
      ? `Rent Overdue — ${safePropertyName}`
      : `Rent Reminder — ${safePropertyName}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "RentEasy Kenya <onboarding@resend.dev>",
        to: [tenantEmail],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: ${isOverdue ? "#dc2626" : "#f59e0b"};">${
          isOverdue ? "⚠️ Rent Overdue" : "🔔 Rent Reminder"
        }</h1>
            <p>Hi <strong>${safeTenantName}</strong>,</p>
            <p>${
              isOverdue
                ? `Your rent for <strong>${safePropertyName}</strong> was due on <strong>${safeDueDate}</strong> and is now <span style="color: #dc2626;">overdue</span>. Please make payment as soon as possible to avoid penalties.`
                : `Your rent for <strong>${safePropertyName}</strong> is due on <strong>${safeDueDate}</strong>. Kindly ensure timely payment to avoid penalties.`
            }</p>
            <p style="margin-top: 30px;">Thank you,<br><strong>RentEasy Kenya</strong></p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-rent-reminder function:", error.message);
    return new Response(JSON.stringify({ error: "Failed to send rent reminder" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
