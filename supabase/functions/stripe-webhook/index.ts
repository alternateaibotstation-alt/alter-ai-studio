import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  if (!webhookSecret) {
    console.error("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET not set");
    return new Response("Server config error", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Signature verification failed:", err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`[STRIPE-WEBHOOK] Event received: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const metadataUserId = subscription.metadata?.user_id || undefined;
        await syncSubscription(subscription, metadataUserId);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `[STRIPE-WEBHOOK] Checkout completed: mode=${session.mode}, customer=${session.customer}, subscription=${session.subscription}`,
        );

        if (session.mode === "subscription") {
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
          const userId = session.metadata?.user_id || session.client_reference_id || undefined;

          if (!subscriptionId) {
            console.error("[STRIPE-WEBHOOK] Subscription checkout completed without subscription id");
            break;
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription, userId);
        }

        if (session.mode === "payment" && session.metadata?.bot_id) {
          console.log(
            `[STRIPE-WEBHOOK] Bot purchase confirmed: bot=${session.metadata.bot_id}, user=${session.metadata.user_id}`,
          );
        }
        break;
      }
      default:
        console.log(`[STRIPE-WEBHOOK] Ignored event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[STRIPE-WEBHOOK] Error processing ${event.type}:`, err);
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function syncSubscription(subscription: Stripe.Subscription, preferredUserId?: string) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price?.id || null;
  const product = subscription.items.data[0]?.price?.product;
  const productId = typeof product === "string" ? product : product?.id || null;

  const userId = preferredUserId || await resolveUserIdFromCustomer(customerId);
  if (!userId) {
    console.error(
      `[STRIPE-WEBHOOK] Could not resolve user for subscription ${subscription.id} and customer ${customerId}`,
    );
    return;
  }

  const currentPeriodStart = (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start;
  const currentPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  const record = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: priceId,
    product_id: productId,
    current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(record, { onConflict: "stripe_subscription_id" });

  if (error) {
    console.error("[STRIPE-WEBHOOK] Upsert error:", error);
    throw error;
  }

  console.log(
    `[STRIPE-WEBHOOK] Synced subscription ${subscription.id} with status=${subscription.status} for user=${userId}`,
  );
}

async function resolveUserIdFromCustomer(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error(`[STRIPE-WEBHOOK] Customer ${customerId} is deleted`);
    return null;
  }

  const customerEmail = customer.email;
  if (!customerEmail) {
    console.error(`[STRIPE-WEBHOOK] Customer ${customerId} has no email`);
    return null;
  }

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[STRIPE-WEBHOOK] Error listing users:", error);
      return null;
    }

    const matchedUser = data.users.find((user) => user.email?.toLowerCase() === customerEmail.toLowerCase());
    if (matchedUser) {
      console.log(`[STRIPE-WEBHOOK] Resolved user ${matchedUser.id} from customer email ${customerEmail}`);
      return matchedUser.id;
    }

    if (data.users.length < 1000) {
      break;
    }
  }

  console.error(`[STRIPE-WEBHOOK] No auth user found for customer email ${customerEmail}`);
  return null;
}
