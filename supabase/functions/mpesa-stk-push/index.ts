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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, tenantId, tenantName }: STKPushRequest = await req.json();
    
    console.log('Initiating M-Pesa STK Push:', { phoneNumber, amount, tenantId, tenantName });

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
      console.error('Token generation failed:', errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('Access token obtained successfully');

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = btoa(`${businessShortCode}${passkey}${timestamp}`);

    // Format phone number (remove leading +254 or 0, keep 254...)
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    console.log('Formatted phone number:', formattedPhone);

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
      TransactionDesc: `Rent payment for ${tenantName}`,
    };

    console.log('STK Push payload:', { ...stkPushPayload, Password: '[REDACTED]' });

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
    console.log('STK Push response:', stkResult);

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
        tenant_name: tenantName,
        amount: amount,
        phone_number: formattedPhone,
        merchant_request_id: stkResult.MerchantRequestID,
        checkout_request_id: stkResult.CheckoutRequestID,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store payment record: ${dbError.message}`);
    }

    console.log('Payment record created:', paymentRecord);

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
    console.error('Error in mpesa-stk-push function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An error occurred processing the payment'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
