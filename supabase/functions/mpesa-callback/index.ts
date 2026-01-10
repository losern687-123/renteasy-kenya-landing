import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Safaricom M-Pesa production IP ranges (for validation)
const SAFARICOM_IP_RANGES = [
  '196.201.214.',
  '196.201.213.',
  '41.223.144.',
  '41.223.145.',
];

// Validate if request is from Safaricom IP range
function isValidSafaricomIP(ip: string | null): boolean {
  if (!ip) return false;
  return SAFARICOM_IP_RANGES.some(range => ip.startsWith(range));
}

// Validate callback payload structure
function validateCallbackPayload(payload: unknown): { isValid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Invalid payload format' };
  }
  
  const body = (payload as Record<string, unknown>).Body;
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Missing Body in payload' };
  }
  
  const stkCallback = (body as Record<string, unknown>).stkCallback;
  if (!stkCallback || typeof stkCallback !== 'object') {
    return { isValid: false, error: 'Missing stkCallback in Body' };
  }
  
  const callback = stkCallback as Record<string, unknown>;
  if (typeof callback.MerchantRequestID !== 'string' || !callback.MerchantRequestID) {
    return { isValid: false, error: 'Invalid MerchantRequestID' };
  }
  
  if (typeof callback.CheckoutRequestID !== 'string' || !callback.CheckoutRequestID) {
    return { isValid: false, error: 'Invalid CheckoutRequestID' };
  }
  
  if (typeof callback.ResultCode !== 'number') {
    return { isValid: false, error: 'Invalid ResultCode' };
  }
  
  return { isValid: true };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error('Invalid method:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get client IP for logging and validation
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Log request origin for audit purposes
    console.log('M-Pesa callback request received:', {
      ip: clientIP,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    // Validate IP origin (warn but don't block in development)
    const isValidIP = isValidSafaricomIP(clientIP);
    if (!isValidIP) {
      console.warn('Callback from non-Safaricom IP:', clientIP);
      // In production, you may want to reject non-Safaricom IPs:
      // return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    const payload = await req.json();
    
    // Validate payload structure
    const validation = validateCallbackPayload(payload);
    if (!validation.isValid) {
      console.error('Invalid callback payload:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { Body } = payload;
    const { stkCallback } = Body;
    
    console.log('M-Pesa callback validated:', {
      merchantRequestId: stkCallback.MerchantRequestID,
      checkoutRequestId: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      timestamp: new Date().toISOString(),
      originIP: clientIP,
      isValidSafaricomIP: isValidIP,
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const merchantRequestId = stkCallback.MerchantRequestID;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // CRITICAL: Verify the payment exists and is in pending status before updating
    const { data: existingPayment, error: fetchError } = await supabase
      .from('mpesa_payments')
      .select('id, status, amount')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (fetchError || !existingPayment) {
      console.error('Payment not found for callback:', {
        checkoutRequestId,
        error: fetchError?.message,
      });
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check: Don't process if already processed
    if (existingPayment.status !== 'pending') {
      console.warn('Payment already processed:', {
        paymentId: existingPayment.id,
        currentStatus: existingPayment.status,
        attemptedUpdate: resultCode === 0 ? 'success' : 'failed',
      });
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let mpesaReceiptNumber = null;
    if (resultCode === 0 && stkCallback.CallbackMetadata) {
      const items = stkCallback.CallbackMetadata.Item;
      const receiptItem = items.find((item: { Name: string; Value: unknown }) => 
        item.Name === 'MpesaReceiptNumber'
      );
      if (receiptItem) {
        mpesaReceiptNumber = receiptItem.Value;
      }
    }

    // Update payment record
    const { data: payment, error: updateError } = await supabase
      .from('mpesa_payments')
      .update({
        status: resultCode === 0 ? 'success' : 'failed',
        result_desc: resultDesc,
        mpesa_receipt_number: mpesaReceiptNumber,
      })
      .eq('checkout_request_id', checkoutRequestId)
      .eq('status', 'pending') // Double-check status hasn't changed
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError.message);
      throw updateError;
    }

    console.log('Payment status updated:', {
      paymentId: payment.id,
      status: payment.status,
      receiptNumber: mpesaReceiptNumber || 'N/A',
      originIP: clientIP,
    });

    // If payment successful, create notification for landlord
    if (resultCode === 0 && payment) {
      // Get tenant's landlord
      const { data: tenant } = await supabase
        .from('tenants')
        .select('landlord_id')
        .eq('id', payment.tenant_id)
        .single();

      if (tenant?.landlord_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: tenant.landlord_id,
            type: 'payment_received',
            message: `New payment of KES ${payment.amount} received from ${payment.tenant_name}`,
          });
        
        console.log('Landlord notification created');
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in mpesa-callback function:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Callback processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
