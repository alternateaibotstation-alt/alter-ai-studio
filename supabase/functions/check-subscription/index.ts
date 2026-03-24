import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toIsoOrNull = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  return null;
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
    if (!user?.email) throw new Error("Not authenticated");

    // Try DB first (fast path)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
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
    } else {
      // Fallback: query Stripe directly
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });

        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });

          if (subs.data.length > 0) {
            const stripeSub = subs.data[0] as any;
            subscribed = true;
            productId = stripeSub.items.data[0].price.product as string;

            if (productId === "prod_UBEJiRN7lDcB4u") tier = "power";
            else if (productId === "prod_UBEIVHEtYoy7QP") tier = "pro";

            const periodEnd = stripeSub.current_period_end;
            const periodStart = stripeSub.current_period_start;
            subscriptionEnd = toIsoOrNull(periodEnd);
            const periodStartISO = toIsoOrNull(periodStart);

            // Backfill DB so future checks are fast
            await supabase.from("subscriptions").upsert({
              user_id: user.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSub.id,
              status: stripeSub.status,
              price_id: stripeSub.items.data[0].price.id,
              product_id: productId,
              current_period_start: periodStartISO,
              current_period_end: subscriptionEnd,
              cancel_at_period_end: stripeSub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            }, { onConflict: "stripe_subscription_id" });
          }
        }
      }
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
