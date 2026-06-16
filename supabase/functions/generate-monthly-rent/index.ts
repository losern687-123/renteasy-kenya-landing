import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generates a 'pending' rent_records row for every approved tenant
// (status='approved', property_id set) for the current calendar month,
// skipping any tenant that already has a record dated within that month.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-indexed
    const monthStart = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const nextMonthStart = new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
    const dueDate = new Date(Date.UTC(year, month, 5)).toISOString().slice(0, 10); // 5th of month

    // Fetch approved tenants with linked property
    const { data: tenants, error: tErr } = await supabase
      .from("tenants")
      .select("id, name, property_id, status, properties:property_id(name, rent_amount)")
      .eq("status", "approved")
      .not("property_id", "is", null);

    if (tErr) throw tErr;

    let created = 0;
    let skipped = 0;

    for (const t of tenants ?? []) {
      const prop: any = (t as any).properties;
      if (!prop?.rent_amount) {
        skipped++;
        continue;
      }

      // Check if a record already exists this month
      const { data: existing } = await supabase
        .from("rent_records")
        .select("id")
        .eq("tenant_id", t.id)
        .gte("due_date", monthStart)
        .lt("due_date", nextMonthStart)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error: insErr } = await supabase.from("rent_records").insert({
        tenant_id: t.id,
        tenant_name: t.name,
        property_name: prop.name,
        amount: prop.rent_amount,
        due_date: dueDate,
        status: "pending",
      });

      if (!insErr) created++;
    }

    return new Response(
      JSON.stringify({ ok: true, created, skipped, month: monthStart }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("generate-monthly-rent error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
