import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generates an 'Unpaid' rent_records row for every approved tenant
// (status='approved', property_id set) for the current calendar month,
// skipping any tenant that already has a record dated within that month.
// Also flips past-due unpaid records to 'Overdue'.
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
    const today = now.toISOString().slice(0, 10);

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
        status: "Unpaid",
      });

      if (!insErr) created++;
    }

    // Mark past-due unpaid records as Overdue
    const { data: overdueRows } = await supabase
      .from("rent_records")
      .update({ status: "Overdue" })
      .in("status", ["Unpaid", "unpaid", "pending"])
      .lt("due_date", today)
      .select("id");

    const overdue = overdueRows?.length ?? 0;

    console.log(JSON.stringify({ ok: true, created, skipped, overdue, month: monthStart }));

    return new Response(
      JSON.stringify({ ok: true, created, skipped, overdue, month: monthStart }),
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
