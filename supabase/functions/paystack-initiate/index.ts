import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface InitiateBody {
  payment_type: "rent" | "subscription" | "verification";
  amount: number;
  email: string;
  metadata: Record<string, unknown>;
}

function validate(body: any): { ok: true; data: InitiateBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const { payment_type, amount, email, metadata } = body;
  if (!["rent", "subscription", "verification"].includes(payment_type))
    return { ok: false, error: "payment_type must be rent | subscription | verification" };
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount))
    return { ok: false, error: "amount must be a positive integer (KES)" };
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "valid email is required" };
  if (!metadata || typeof metadata !== "object")
    return { ok: false, error: "metadata is required" };

  const m = metadata as Record<string, unknown>;
  if (payment_type === "rent") {
    if (!m.tenant_id || !m.landlord_id || !m.rent_record_id)
      return { ok: false, error: "rent metadata requires tenant_id, landlord_id, rent_record_id" };
  } else if (payment_type === "subscription") {
    if (!m.landlord_id || !m.tier)
      return { ok: false, error: "subscription metadata requires landlord_id, tier" };
  } else if (payment_type === "verification") {
    if (!m.landlord_id)
      return { ok: false, error: "verification metadata requires landlord_id" };
  }
  return { ok: true, data: { payment_type, amount, email, metadata: m } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackKey) return json({ error: "Paystack not configured" }, 500);

    const authClient = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await authClient.auth.getUser(token);
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    const v = validate(body);
    if (!v.ok) return json({ error: v.error }, 400);
    const { payment_type, amount, email, metadata } = v.data;

    const reference = crypto.randomUUID();
    const admin = createClient(supabaseUrl, serviceKey);

    // Pending row
    const { error: insertErr } = await admin.from("paystack_transactions").insert({
      reference,
      user_id: userId,
      payment_type,
      amount,
      currency: "KES",
      status: "pending",
      metadata: { ...metadata, payment_type },
    });
    if (insertErr) {
      console.error("Insert error:", insertErr);
      return json({ error: "Failed to record transaction" }, 500);
    }

    // Paystack initialize
    const psResp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // kobo
        currency: "KES",
        reference,
        metadata: { ...metadata, payment_type, user_id: userId },
      }),
    });
    const psData = await psResp.json().catch(() => ({}));

    if (!psResp.ok || !psData?.status) {
      await admin
        .from("paystack_transactions")
        .update({ status: "failed", paystack_response: psData })
        .eq("reference", reference);
      console.error("Paystack init failed:", psData);
      return json({ error: "Paystack initialization failed", details: psData }, 502);
    }

    await admin
      .from("paystack_transactions")
      .update({ paystack_response: psData })
      .eq("reference", reference);

    return json({
      authorization_url: psData.data?.authorization_url,
      access_code: psData.data?.access_code,
      reference,
    });
  } catch (err) {
    console.error("paystack-initiate error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
