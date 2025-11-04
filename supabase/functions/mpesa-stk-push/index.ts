import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  tenantId: string;
  tenantName: string;
}

// Input validation function
function validatePaymentInput(data: STKPushRequest): { valid: boolean; error?: string } {
  // Validate phone number (Kenyan format after formatting: 254XXXXXXXXX)
  const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
  if (!data.phoneNumber || !phoneRegex.test(data.phoneNumber.replace(/\s/g, ''))) {
    return { valid: false, error: "Invalid Kenyan phone number format" };
  }

  // Validate amount (between 1 and 1,000,000 KES)
  if (!data.amount || typeof data.amount !== 'number' || data.amount < 1 || data.amount > 1000000) {
    return { valid: false, error: "Amount must be between 1 and 1,000,000 KES" };
  }

  // Validate tenant ID (must be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!data.tenantId || !uuidRegex.test(data.tenantId)) {
    return { valid: false, error: "Invalid tenant ID" };
  }

  // Validate tenant name
  if (!data.tenantName || data.tenantName.trim().length === 0 || data.tenantName.length > 100) {
    return { valid: false, error: "Invalid tenant name (must be 1-100 characters)" };
  }

  return { valid: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestData: STKPushRequest = await req.json();

    // Validate input
    const validation = validatePaymentInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { phoneNumber, amount, tenantId, tenantName } = requestData;

    // Verify the authenticated user is the tenant making the payment
    if (user.id !== tenantId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Forbidden: You can only make payments for your own account' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize for logging - don't log full phone or PII
    console.log('M-Pesa STK Push initiated:', {
      tenantId,
      amount,
      phonePrefix: phoneNumber.substring(0, 6) + '****',
    });

    // Get M-Pesa credentials from environment
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const businessShortCode = Deno.env.get('MPESA_BUSINESS_SHORT_CODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      throw new Error('M-Pesa credentials not configured');
    }

    // Step 1: Get OAuth access token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token generation failed');
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = btoa(`${businessShortCode}${passkey}${timestamp}`);

    // Format phone number (remove leading +254 or 0, keep 254...)
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    // Step 3: Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
      AccountReference: `RENT-${tenantId.substring(0, 8)}`,
      TransactionDesc: `Rent payment for ${tenantName.trim().substring(0, 30)}`,
    };

    const stkResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkPushPayload),
      }
    );

    const stkResult = await stkResponse.json();

    if (!stkResponse.ok || stkResult.ResponseCode !== '0') {
      throw new Error(stkResult.errorMessage || stkResult.ResponseDescription || 'STK Push failed');
    }

    // Step 4: Store payment record in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: paymentRecord, error: dbError } = await supabase
      .from('mpesa_payments')
      .insert({
        tenant_id: tenantId,
        tenant_name: tenantName.trim(),
        amount: amount,
        phone_number: formattedPhone,
        merchant_request_id: stkResult.MerchantRequestID,
        checkout_request_id: stkResult.CheckoutRequestID,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError.message);
      throw new Error('Failed to store payment record');
    }

    console.log('Payment record created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK Push initiated successfully. Please check your phone.',
        merchantRequestId: stkResult.MerchantRequestID,
        checkoutRequestId: stkResult.CheckoutRequestID,
        paymentId: paymentRecord.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in mpesa-stk-push function:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Payment initiation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
