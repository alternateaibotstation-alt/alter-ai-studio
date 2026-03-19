import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Not authenticated");

    const { botId } = await req.json();
    if (!botId) throw new Error("botId is required");

    // Fetch bot details
    const { data: bot, error: botError } = await supabaseClient
      .from("bots")
      .select("id, name, price, description")
      .eq("id", botId)
      .single();
    if (botError || !bot) throw new Error("Bot not found");
    if (!bot.price || bot.price <= 0) throw new Error("This bot is free");

    // Check if already purchased
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: existing } = await serviceClient
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("bot_id", botId)
      .limit(1);
    if (existing && existing.length > 0) {
      throw new Error("Already purchased");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or skip existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const priceInCents = Math.round(bot.price * 100);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: bot.name,
              description: bot.description || `Access to ${bot.name} AI bot`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/chat/${botId}?purchased=true`,
      cancel_url: `${req.headers.get("origin")}/chat/${botId}`,
      metadata: {
        bot_id: botId,
        user_id: user.id,
        platform_fee_cents: Math.round(priceInCents * 0.2).toString(),
      },
      payment_intent_data: {
        metadata: {
          bot_id: botId,
          user_id: user.id,
        },
      },
    });

    // Record purchase as pending (will be confirmed on success page)
    await serviceClient.from("purchases").insert({
      user_id: user.id,
      bot_id: botId,
      amount: bot.price,
      stripe_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
