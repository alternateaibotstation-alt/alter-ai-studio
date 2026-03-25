import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const platformPrompts: Record<string, string> = {
  tiktok: `Generate TikTok content. Fast-paced, emotional, curiosity-driven. Return JSON:
{
  "hook": "scroll-stopping first line",
  "scenes": [{"number":1,"text":"frame text","duration_seconds":4}],
  "image_prompts": [{"scene_number":1,"prompt":"detailed cinematic 4K prompt with lighting/mood"}],
  "video_scenes": [{"scene_number":1,"description":"camera movement, expression, environment"}],
  "editing": {"pacing":"","transitions":"","zoom_effects":"","caption_style":"","music_mood":""},
  "caption": "curiosity-driven caption",
  "cta": "non-salesy call to action",
  "hashtags": ["relevant","hashtags"]
}
Generate 4-6 scenes. Each image prompt must be cinematic, realistic, 4K, with specific lighting.`,

  instagram: `Generate Instagram Reels content. Aesthetic, slightly emotional, personal brand feel. Return JSON:
{
  "reel_hook": "attention-grabbing first line for Reels",
  "caption": "engaging aesthetic caption with line breaks for readability",
  "hashtags": ["relevant","instagram","hashtags"],
  "visual_direction": "overall visual style and color palette guidance",
  "scenes": [{"number":1,"text":"what appears on screen","duration_seconds":3}],
  "image_prompts": [{"scene_number":1,"prompt":"aesthetic, clean, Instagram-worthy 4K prompt"}],
  "cta": "soft call to action"
}
Generate 4-6 scenes optimized for Reels format (9:16).`,

  facebook: `Generate Facebook post content. Relatable storytelling tone, encourage engagement. Return JSON:
{
  "post": "full Facebook post with storytelling, short paragraphs, relatable tone",
  "engagement_question": "question to encourage comments",
  "cta": "call to action",
  "visual_prompt": "image prompt for the post visual, clean and shareable",
  "hashtags": ["facebook","hashtags"]
}
Make the post 3-5 short paragraphs. Focus on storytelling and relatability.`,

  pinterest: `Generate Pinterest pin content. SEO-optimized, clean aesthetic, clickable. Return JSON:
{
  "pin_title": "SEO-optimized pin title (max 100 chars)",
  "pin_description": "keyword-rich description for search discovery",
  "visual_prompt": "clean, aesthetic, Pinterest-worthy image prompt, bright colors, text overlay friendly",
  "keywords": ["seo","keywords","for","discovery"],
  "board_suggestion": "suggested Pinterest board name"
}
Focus on search discoverability and visual appeal.`,

  linkedin: `Generate LinkedIn post content. Professional, value-driven, authority-building. Return JSON:
{
  "post": "professional LinkedIn post with short paragraphs, value-driven insights about AI/business/automation",
  "hook": "strong opening line that stops scrolling in a professional feed",
  "cta": "professional call to action",
  "hashtags": ["linkedin","professional","hashtags"]
}
Use short paragraphs. Focus on business value, AI opportunity, and professional growth. Authority-building voice.`,

  twitter: `Generate Twitter/X content. Punchy, curiosity-driven, viral potential. Return JSON:
{
  "main_tweet": "single viral tweet (max 280 chars)",
  "thread": ["tweet 1 (hook)","tweet 2","tweet 3","tweet 4","tweet 5 (CTA)"],
  "hashtags": ["viral","hashtags"]
}
Create both a standalone viral tweet AND a 3-5 tweet thread. Short, sharp, curiosity-driven.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt, platforms = ["tiktok"], storyProfile, previousScenes } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build character/style context
    let characterContext = "";
    if (storyProfile) {
      const parts: string[] = [];
      if (storyProfile.characters?.length) {
        parts.push("CHARACTERS:\n" +
          storyProfile.characters.map((c: any) =>
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

    // Generate content for each platform in parallel
    const validPlatforms = (platforms as string[]).filter(p => platformPrompts[p]);
    if (validPlatforms.length === 0) {
      return new Response(JSON.stringify({ error: "No valid platforms selected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    // Process platforms — batch up to 3 concurrent to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < validPlatforms.length; i += batchSize) {
      const batch = validPlatforms.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (platform) => {
          const systemPrompt = `You are a viral content strategist specializing in ${platform} content.
${characterContext}
RULES:
- Content must be platform-appropriate (no explicit/harmful content)
- Visuals can be suggestive but safe for AI personality content
- Focus on virality, engagement, and retention
- Each scene must have duration_seconds of at least 3 seconds
${continuationContext}
${platformPrompts[platform]}
Respond with ONLY valid JSON (no markdown, no code blocks).`;

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Create optimized ${platform} content for: ${prompt.trim()}` },
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

      // Small delay between batches to avoid rate limits
      if (i + batchSize < validPlatforms.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ content: results, errors }), {
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
