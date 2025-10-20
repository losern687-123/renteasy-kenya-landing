import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(payload, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract callback data
    const { Body } = payload;
    const { stkCallback } = Body;
    
    const merchantRequestId = stkCallback.MerchantRequestID;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    let mpesaReceiptNumber = null;
    if (resultCode === 0 && stkCallback.CallbackMetadata) {
      const items = stkCallback.CallbackMetadata.Item;
      const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
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
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment:', updateError);
      throw updateError;
    }

    console.log('Payment updated successfully:', payment);

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
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in mpesa-callback function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
