import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { action, referralCode } = await req.json();

    if (action === "generate") {
      // Generate a referral code for an authenticated user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (!userData?.user) throw new Error("Not authenticated");

      // Check if user already has a referral code
      const { data: existing } = await supabaseClient
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", userData.user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ code: existing[0].referral_code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a unique code
      const code = userData.user.id.slice(0, 8).toUpperCase();
      await supabaseClient.from("referrals").insert({
        referrer_id: userData.user.id,
        referral_code: code,
      });

      return new Response(JSON.stringify({ code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "redeem") {
      // Redeem a referral code for a newly signed-up user
      if (!referralCode || !referredUserId) throw new Error("Missing params");

      const { data: referral } = await supabaseClient
        .from("referrals")
        .select("*")
        .eq("referral_code", referralCode)
        .is("referred_id", null)
        .single();

      if (!referral) {
        return new Response(JSON.stringify({ error: "Invalid or already used code" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Don't allow self-referral
      if (referral.referrer_id === referredUserId) {
        return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark referral as used
      await supabaseClient.from("referrals").update({
        referred_id: referredUserId,
        rewarded: true,
      }).eq("id", referral.id);

      // Give both users 20 bonus messages
      // Referrer
      const { data: referrerUsage } = await supabaseClient.rpc("get_or_reset_usage", { p_user_id: referral.referrer_id });
      await supabaseClient.from("user_usage").update({
        bonus_messages: (referrerUsage?.bonus_messages || 0) + 20,
      }).eq("user_id", referral.referrer_id);

      // Referred user
      const { data: referredUsage } = await supabaseClient.rpc("get_or_reset_usage", { p_user_id: referredUserId });
      await supabaseClient.from("user_usage").update({
        bonus_messages: (referredUsage?.bonus_messages || 0) + 20,
      }).eq("user_id", referredUserId);

      // Create a new referral code for the referrer (so they can refer more people)
      const newCode = referral.referrer_id.slice(0, 8).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
      await supabaseClient.from("referrals").insert({
        referrer_id: referral.referrer_id,
        referral_code: newCode,
      });

      return new Response(JSON.stringify({ success: true, bonus: 20 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stats") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (!userData?.user) throw new Error("Not authenticated");

      const { data: referrals } = await supabaseClient
        .from("referrals")
        .select("*")
        .eq("referrer_id", userData.user.id);

      const activeCode = referrals?.find((r) => !r.referred_id)?.referral_code || null;
      const totalReferred = referrals?.filter((r) => r.rewarded).length || 0;

      return new Response(JSON.stringify({ code: activeCode, totalReferred }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
