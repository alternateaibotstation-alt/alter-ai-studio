import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TREND_MODES: Record<string, string> = {
  viral_storytime: "Use dramatic storytelling. Build suspense. Personal confession tone. Fast cuts, emotional music. Dark moody lighting.",
  dark_psychology: "Use dark psychology hooks. Expose hidden truths. Conspiracy-adjacent curiosity. Slow zooms, intense eye contact shots.",
  luxury_lifestyle: "Luxury aesthetic. Rich textures, gold tones, designer brands. Aspirational but attainable. Slow motion glamour shots.",
  ai_futuristic: "Futuristic AI aesthetic. Neon blue/purple tones, holographic overlays, tech interfaces. Cutting-edge and mysterious.",
  motivational_viral: "High energy motivation. Powerful quotes, intense workout/hustle footage. Dramatic music crescendo. Fast-paced edits.",
  soft_feminine: "Soft feminine aesthetic. Pastel tones, golden hour lighting, delicate movements. ASMR-like calm. Dreamy and aspirational.",
};

function buildSystemPrompt(platform: string, trendMode: string | null, storyProfile: any, previousScenes: any[], tier: string) {
  const trendContext = trendMode && TREND_MODES[trendMode]
    ? `\n\nTREND MODE ACTIVE — "${trendMode}":\n${TREND_MODES[trendMode]}\nApply this aesthetic to ALL visual prompts, tone, and pacing.\n`
    : "";

  let characterContext = "";
  if (storyProfile) {
    const parts: string[] = [];
    if (storyProfile.characters?.length) {
      parts.push("CHARACTERS:\n" + storyProfile.characters.map((c: any) =>
        `- ${c.name}: Appearance: ${c.appearance}. Personality: ${c.personality}`
      ).join("\n"));
    }
    if (storyProfile.visualStyle) parts.push(`VISUAL STYLE: ${storyProfile.visualStyle}`);
    if (storyProfile.mood) parts.push(`MOOD/TONE: ${storyProfile.mood}`);
    if (storyProfile.setting) parts.push(`SETTING: ${storyProfile.setting}`);
    if (parts.length) characterContext = "\n\nCHARACTER & STYLE PROFILE:\n" + parts.join("\n");
  }

  let continuationContext = "";
  if (previousScenes?.length) {
    continuationContext = `\n\nPREVIOUS SCENES (continue from here):\n${
      previousScenes.map((s: any) => `Scene ${s.number}: ${s.text}`).join("\n")
    }\nStart numbering from ${previousScenes.length + 1}.`;
  }

  const isPro = tier === "pro" || tier === "power";

  if (!isPro) {
    // FREE tier: limited output
    return `You are a viral content strategist. The user is on a FREE plan.
${characterContext}${trendContext}
Generate a TEASER-level content brief for ${platform}. Return JSON:
{
  "hook": "one scroll-stopping hook line",
  "concept": "2-sentence content concept summary",
  "content_type": "${platform}",
  "locked_features": ["Full scene breakdown", "AI generation prompts", "Caption engine", "Hashtag pack", "Remix variations"]
}
Respond with ONLY valid JSON (no markdown, no code blocks).`;
  }

  // PRO tier: full output
  return `You are an elite viral content strategist specializing in ${platform} content.
${characterContext}${trendContext}
RULES:
- Produce FINISHED, post-ready content — never explain or teach
- Every visual prompt must be cinematic, 4K, specific lighting/mood
- Content must be platform-appropriate
- Focus on virality, engagement, and retention
- Each scene must have duration_seconds of at least 3 seconds
${continuationContext}

Return JSON:
{
  "hook": "scroll-stopping first line",
  "hooks": ["hook 1","hook 2","hook 3","hook 4","hook 5"],
  "scenes": [{"number":1,"text":"frame text","visual_direction":"camera angle, lighting, aesthetic","duration_seconds":4}],
  "ai_prompts": {
    "runway": "ready-to-paste Runway Gen-3 prompt for this exact visual",
    "midjourney": "ready-to-paste Midjourney prompt",
    "pika": "ready-to-paste Pika prompt",
    "sora": "ready-to-paste Sora prompt",
    "capcut_ai": "ready-to-paste CapCut AI prompt"
  },
  "caption": {
    "primary": "hook-driven caption with emotional triggers and CTA",
    "variation_1": "alternate caption version",
    "variation_2": "alternate caption version"
  },
  "hashtags": ["15-20","platform-optimized","viral+niche","hashtags"],
  "editing": {"pacing":"","transitions":"","zoom_effects":"","caption_style":"","music_mood":""},
  "trend_mode_applied": "${trendMode || 'none'}"
}
Generate 4-6 scenes. Respond with ONLY valid JSON (no markdown, no code blocks).`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    let tier = "free";

    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subData } = await supabase.from("subscriptions")
          .select("product_id, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        if (subData) {
          const proProductId = "prod_UBEIVHEtYoy7QP";
          const powerProductId = "prod_UBEJiRN7lDcB4u";
          if (subData.product_id === powerProductId) tier = "power";
          else if (subData.product_id === proProductId) tier = "pro";
        }
      }
    }

    const { prompt, platforms = ["tiktok"], storyProfile, previousScenes, trendMode, remixOptions } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle remix: modify the prompt based on remix options
    let finalPrompt = prompt.trim();
    if (remixOptions) {
      const parts: string[] = [`Original concept: ${finalPrompt}`];
      if (remixOptions.niche) parts.push(`Adapt for niche: ${remixOptions.niche}`);
      if (remixOptions.tone) parts.push(`Change emotional tone to: ${remixOptions.tone}`);
      if (remixOptions.platform) parts.push(`Reformat for: ${remixOptions.platform}`);
      finalPrompt = parts.join(". ");
    }

    const validPlatforms = (platforms as string[]).filter(p => ["tiktok", "instagram", "facebook", "pinterest", "linkedin", "twitter"].includes(p));
    if (validPlatforms.length === 0) {
      return new Response(JSON.stringify({ error: "No valid platforms selected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    const batchSize = 3;
    for (let i = 0; i < validPlatforms.length; i += batchSize) {
      const batch = validPlatforms.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (platform) => {
          const systemPrompt = buildSystemPrompt(platform, trendMode || null, storyProfile, previousScenes || [], tier);

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: tier === "free" ? "google/gemini-3-flash-preview" : "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Create optimized ${platform} content for: ${finalPrompt}` },
              ],
            }),
          });

          if (!response.ok) {
            if (response.status === 429) throw new Error("Rate limited");
            if (response.status === 402) throw new Error("Credits exhausted");
            throw new Error(`AI error: ${response.status}`);
          }

          const data = await response.json();
          const raw = data.choices?.[0]?.message?.content || "";
          let cleaned = raw.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          return { platform, content: JSON.parse(cleaned) };
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results[result.value.platform] = result.value.content;
        } else {
          const platform = batch[batchResults.indexOf(result)];
          errors[platform] = result.reason?.message || "Generation failed";
          console.error(`Failed for ${platform}:`, result.reason);
        }
      }

      if (i + batchSize < validPlatforms.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ content: results, errors, tier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-studio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
