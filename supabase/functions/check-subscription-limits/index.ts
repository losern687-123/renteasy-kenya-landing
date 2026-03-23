import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LimitCheckRequest {
  landlord_id: string;
  limit_type: "properties" | "tenants";
}

interface LimitCheckResponse {
  tier_name: string;
  display_name: string;
  limit: number | null;
  current_count: number;
  can_add: boolean;
  is_unlimited: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { limit_type }: { limit_type?: string } = await req.json();
    
    // Use authenticated user's ID — never trust client-supplied landlord_id
    const landlord_id = user.id;

    // Validate input
    if (!limit_type) {
      return new Response(
        JSON.stringify({ error: "limit_type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["properties", "tenants"].includes(limit_type)) {
      return new Response(
        JSON.stringify({ error: "limit_type must be 'properties' or 'tenants'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${limit_type} limits for landlord: ${landlord_id}`);

    // Fetch landlord's active subscription
    const { data: subscription, error: subError } = await supabase
      .from("landlord_subscriptions")
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq("landlord_id", landlord_id)
      .eq("status", "active")
      .single();

    // Default to free tier if no subscription
    let tier;
    if (subError || !subscription) {
      console.log("No active subscription found, defaulting to free tier");
      const { data: freeTier, error: freeError } = await supabase
        .from("subscription_tiers")
        .select("*")
        .eq("name", "free")
        .single();

      if (freeError || !freeTier) {
        // Hardcoded free tier fallback
        tier = {
          name: "free",
          display_name: "Free",
          max_properties: 5,
          max_tenants: 10,
        };
      } else {
        tier = freeTier;
      }
    } else {
      tier = subscription.tier;
    }

    // Count current properties or tenants
    const tableName = limit_type === "properties" ? "properties" : "tenants";
    const { count, error: countError } = await supabase
      .from(tableName)
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", landlord_id);

    if (countError) {
      console.error("Count error:", countError);
      throw countError;
    }

    const currentCount = count || 0;
    const limit = limit_type === "properties" ? tier.max_properties : tier.max_tenants;
    const isUnlimited = limit === null;
    const canAdd = isUnlimited || currentCount < limit;

    const response: LimitCheckResponse = {
      tier_name: tier.name,
      display_name: tier.display_name,
      limit,
      current_count: currentCount,
      can_add: canAdd,
      is_unlimited: isUnlimited,
    };

    console.log("Limit check result:", response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-subscription-limits:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
