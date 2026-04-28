import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_TO_STRIPE_PRICE = {
  free: null,
  starter: "price_1TR0AG4NFqfF77Iy6XvkH0pQ",
  creator: "price_1TR0E94NFqfF77IyqlUOxmkc",
  pro: "price_1TR0Fb4NFqfF77IygzdnqHji",
  studio: "price_1TR0G34NFqfF77IyvMKP0ggx",
} as const;

type CheckoutPlan = keyof typeof PLAN_TO_STRIPE_PRICE;

type CheckoutRequestDetails = {
  requestId: string;
  method: string;
  origin: string | null;
  userAgent: string | null;
  hasAuthHeader: boolean;
  tier?: unknown;
  requestedPriceId?: unknown;
  hasCoupon?: boolean;
  userId?: string;
};

const isCheckoutPlan = (value: unknown): value is CheckoutPlan => {
  return typeof value === "string" && value in PLAN_TO_STRIPE_PRICE;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestDetails: CheckoutRequestDetails = {
    requestId: crypto.randomUUID(),
    method: req.method,
    origin: req.headers.get("origin"),
    userAgent: req.headers.get("user-agent"),
    hasAuthHeader: Boolean(req.headers.get("Authorization")),
  };

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { tier, priceId: requestedPriceId, coupon } = await req.json();
    requestDetails.tier = tier;
    requestDetails.requestedPriceId = requestedPriceId;
    requestDetails.hasCoupon = Boolean(coupon);
    if (!isCheckoutPlan(tier)) throw new Error("Invalid tier");

    const priceId = PLAN_TO_STRIPE_PRICE[tier];
    if (!priceId) {
      return new Response(JSON.stringify({ checkout_required: false, tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (requestedPriceId && requestedPriceId !== priceId) throw new Error("Selected plan does not match price ID");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Not authenticated");
    requestDetails.userId = user.id;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/success?subscription=true&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing?checkout_cancelled=true&tier=${tier}`,
      metadata: {
        user_id: user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier,
        },
      },
    };
    if (coupon) {
      sessionParams.discounts = [{ coupon }];
      sessionParams.payment_method_collection = "if_required";
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[create-checkout] Checkout session creation failed", {
      ...requestDetails,
      error: msg,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
