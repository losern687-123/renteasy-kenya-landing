import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ok200 = () =>
  new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function hmacSha512Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return ok200();

  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const raw = await req.text();
  const sigHeader = req.headers.get("x-paystack-signature") ?? "";

  if (!paystackKey) {
    console.error("PAYSTACK_SECRET_KEY missing");
    return new Response("Misconfigured", { status: 401, headers: corsHeaders });
  }

  const expected = await hmacSha512Hex(paystackKey, raw);
  if (expected !== sigHeader) {
    console.warn("Invalid Paystack signature");
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  let evt: any;
  try {
    evt = JSON.parse(raw);
  } catch {
    return ok200();
  }

  if (evt?.event !== "charge.success") return ok200();

  const admin = createClient(supabaseUrl, serviceKey);
  const data = evt.data ?? {};
  const reference: string | undefined = data.reference;
  if (!reference) return ok200();

  try {
    // Find pending tx
    const { data: tx, error: txErr } = await admin
      .from("paystack_transactions")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (txErr || !tx) {
      console.warn("Transaction not found for reference:", reference);
      return ok200();
    }

    if (tx.status === "success") return ok200(); // idempotent

    // Mark success
    await admin
      .from("paystack_transactions")
      .update({ status: "success", paystack_response: data })
      .eq("reference", reference);

    const meta = (tx.metadata ?? {}) as Record<string, any>;
    const paymentType: string = tx.payment_type;
    let entityId: string | null = null;

    if (paymentType === "rent" && meta.rent_record_id) {
      const today = new Date().toISOString().split("T")[0];
      await admin
        .from("rent_records")
        .update({
          status: "Paid",
          payment_method: "Paystack",
          payment_date: today,
          receipt_url: reference,
        })
        .eq("id", meta.rent_record_id);
      entityId = meta.rent_record_id;
    } else if (paymentType === "subscription" && meta.landlord_id && meta.tier) {
      // Resolve tier by name
      const { data: tier } = await admin
        .from("subscription_tiers")
        .select("id, name")
        .eq("name", meta.tier)
        .maybeSingle();

      if (tier) {
        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + 1);

        // Upsert: deactivate prior active subs, then insert active
        await admin
          .from("landlord_subscriptions")
          .update({ status: "cancelled" })
          .eq("landlord_id", meta.landlord_id)
          .eq("status", "active");

        const { data: newSub } = await admin
          .from("landlord_subscriptions")
          .insert({
            landlord_id: meta.landlord_id,
            tier_id: tier.id,
            status: "active",
            billing_cycle: "monthly",
            start_date: now.toISOString(),
            end_date: end.toISOString(),
          })
          .select()
          .maybeSingle();

        await admin.from("subscription_payments").insert({
          landlord_id: meta.landlord_id,
          subscription_id: newSub?.id ?? null,
          amount: tx.amount,
          currency: "KES",
          payment_method: "Paystack",
          payment_reference: reference,
          status: "success",
          payment_date: now.toISOString(),
          period_start: now.toISOString().split("T")[0],
          period_end: end.toISOString().split("T")[0],
          metadata: { paystack: data },
        });

        await admin.from("profiles").update({ current_tier: tier.name }).eq("id", meta.landlord_id);
        entityId = newSub?.id ?? meta.landlord_id;
      }
    } else if (paymentType === "verification" && meta.landlord_id) {
      await admin
        .from("profiles")
        .update({ verification_fee_paid: true })
        .eq("id", meta.landlord_id);
      entityId = meta.landlord_id;
    }

    // Audit log
    await admin.from("activity_logs").insert({
      user_id: tx.user_id,
      action: "paystack_payment_received",
      entity_type: paymentType,
      entity_id: entityId,
      details: {
        reference,
        amount: tx.amount,
        currency: tx.currency,
        payment_type: paymentType,
        metadata: meta,
      },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still return 200 so Paystack doesn't retry indefinitely
  }

  return ok200();
});
