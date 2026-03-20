import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    // Check admin role
    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get platform stats from DB
    const { data: dbStats, error: dbError } = await supabaseClient.rpc("get_platform_stats");
    if (dbError) throw new Error(dbError.message);

    // Get Stripe revenue data
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripeStats = {
      active_subscribers: 0,
      mrr: 0,
      total_revenue: 0,
      subscribers_by_tier: { pro: 0, power: 0 },
      recent_charges: [] as any[],
    };

    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Active subscriptions
      const subs = await stripe.subscriptions.list({ status: "active", limit: 100 });
      stripeStats.active_subscribers = subs.data.length;

      let mrr = 0;
      for (const sub of subs.data) {
        const amount = sub.items.data[0]?.price?.unit_amount || 0;
        mrr += amount;
        const productId = sub.items.data[0]?.price?.product;
        if (productId === "prod_UBEJiRN7lDcB4u") stripeStats.subscribers_by_tier.power++;
        else if (productId === "prod_UBEIVHEtYoy7QP") stripeStats.subscribers_by_tier.pro++;
      }
      stripeStats.mrr = mrr / 100; // Convert cents to dollars

      // Total revenue from balance transactions (last 30 days)
      try {
        const charges = await stripe.charges.list({
          limit: 100,
          created: { gte: Math.floor(Date.now() / 1000) - 30 * 86400 },
        });
        stripeStats.total_revenue = charges.data
          .filter((c) => c.paid && !c.refunded)
          .reduce((sum, c) => sum + c.amount, 0) / 100;

        stripeStats.recent_charges = charges.data.slice(0, 10).map((c) => ({
          amount: c.amount / 100,
          created: new Date(c.created * 1000).toISOString(),
          status: c.status,
          email: c.billing_details?.email || "Unknown",
        }));
      } catch (e) {
        console.error("Charges fetch error:", e);
      }
    }

    return new Response(JSON.stringify({ db: dbStats, stripe: stripeStats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("admin-analytics error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
