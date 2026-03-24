import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    // Read from subscriptions table instead of Stripe API
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let tier = "free";
    let subscribed = false;
    let subscriptionEnd = null;
    let productId = null;

    if (sub) {
      subscribed = true;
      subscriptionEnd = sub.current_period_end;
      productId = sub.product_id;

      if (productId === "prod_UBEJiRN7lDcB4u") tier = "power";
      else if (productId === "prod_UBEIVHEtYoy7QP") tier = "pro";
    }

    const { data: usage } = await supabase.rpc("get_or_reset_usage", { p_user_id: user.id });

    return new Response(JSON.stringify({
      subscribed,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      usage: usage || { messages_used_today: 0, images_used_today: 0, bonus_messages: 0 },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
