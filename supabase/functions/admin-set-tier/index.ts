import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_TIERS = ["free", "starter", "creator", "pro", "studio", "power"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser) throw new Error("Not authenticated");

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: adminUser.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin access required");

    const body = await req.json();

    // GET current overrides
    if (body.action === "list") {
      const { data: overrides } = await supabase
        .from("tier_overrides")
        .select("*")
        .order("created_at", { ascending: false });
      return new Response(JSON.stringify({ overrides: overrides ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SET tier override
    if (body.action === "set") {
      const { target_user_id, tier, reason, expires_in_hours } = body;
      if (!target_user_id) throw new Error("target_user_id required");
      if (!tier || !VALID_TIERS.includes(tier)) throw new Error(`Invalid tier. Must be one of: ${VALID_TIERS.join(", ")}`);

      const expiresAt = expires_in_hours
        ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
        : null;

      // If tier is "free", remove the override instead
      if (tier === "free") {
        await supabase.from("tier_overrides").delete().eq("user_id", target_user_id);
        return new Response(JSON.stringify({ success: true, action: "removed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("tier_overrides").upsert({
        user_id: target_user_id,
        tier,
        reason: reason || "Admin testing",
        set_by: adminUser.id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) throw new Error(`Failed to set override: ${error.message}`);

      return new Response(JSON.stringify({ success: true, tier, expires_at: expiresAt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REMOVE tier override
    if (body.action === "remove") {
      const { target_user_id } = body;
      if (!target_user_id) throw new Error("target_user_id required");

      await supabase.from("tier_overrides").delete().eq("user_id", target_user_id);
      return new Response(JSON.stringify({ success: true, action: "removed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use: list, set, remove");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
