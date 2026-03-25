import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt, platform = "tiktok", storyProfile, previousScenes } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build character/style context block
    let characterContext = "";
    if (storyProfile) {
      const parts: string[] = [];
      if (storyProfile.characters?.length) {
        parts.push("CHARACTERS (use these exact descriptions in every image prompt for consistency):\n" +
          storyProfile.characters.map((c: any) =>
            `- ${c.name}: Appearance: ${c.appearance}. Personality: ${c.personality}`
          ).join("\n"));
      }
      if (storyProfile.visualStyle) parts.push(`VISUAL STYLE: ${storyProfile.visualStyle}`);
      if (storyProfile.mood) parts.push(`MOOD/TONE: ${storyProfile.mood}`);
      if (storyProfile.setting) parts.push(`SETTING: ${storyProfile.setting}`);
      if (parts.length) characterContext = "\n\nCHARACTER & STYLE PROFILE (MUST maintain across all scenes and image prompts):\n" + parts.join("\n");
    }

    let continuationContext = "";
    if (previousScenes?.length) {
      continuationContext = `\n\nPREVIOUS SCENES (continue the story from where this left off, maintain same characters, visual style, and narrative arc):\n${
        previousScenes.map((s: any) => `Scene ${s.number}: ${s.text}`).join("\n")
      }\n\nIMPORTANT: Start scene numbering from ${previousScenes.length + 1}. The new content should feel like a natural continuation.`;
    }

    const systemPrompt = `You are a viral content strategist and creative director specializing in short-form video content for ${platform}. You create COMPLETE, ready-to-use content packages.
${characterContext}
IMPORTANT RULES:
- Content must be TikTok-friendly (no explicit sexual content, no illegal/harmful content)
- Visuals can be "suggestive but safe" for AI personality/companion content
- Focus on scroll-stopping hooks and emotional engagement
- Optimize for virality, curiosity gaps, and retention
- Each scene MUST have a duration_seconds of at least 3 seconds (recommended 4-5 seconds)
- ALL image prompts MUST include the exact character descriptions from the profile so AI image generators produce consistent-looking characters across scenes
${continuationContext}
You MUST respond with ONLY valid JSON in this exact structure (no markdown, no code blocks):
{
  "hook": "The scroll-stopping first line (1 sentence)",
  "scenes": [
    { "number": 1, "text": "What appears on screen / voiceover line", "duration_seconds": 4 }
  ],
  "image_prompts": [
    { "scene_number": 1, "prompt": "Detailed cinematic image prompt, 4K, realistic, with specific lighting and mood. Include EXACT character appearance details. Compatible with AI image generators." }
  ],
  "video_scenes": [
    { "scene_number": 1, "description": "Camera movement, facial expression, environment, motion details" }
  ],
  "editing": {
    "pacing": "seconds per clip recommendation",
    "transitions": "transition style between scenes",
    "zoom_effects": "zoom/pan recommendations",
    "caption_style": "word-by-word, bold text, etc.",
    "music_mood": "suggested music vibe/genre"
  },
  "caption": "Short, curiosity-driven caption for the post",
  "cta": "Non-salesy call to action",
  "hashtags": ["relevant", "hashtags", "for", "reach"]
}

Generate 4-6 scenes. Each image prompt must be detailed, cinematic, realistic, high-detail (4K), with specific lighting and mood specified. Make them compatible with Stable Diffusion, DALL-E, and Midjourney.`;

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
          { role: "user", content: `Create viral ${platform} content for: ${prompt.trim()}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown code blocks if present)
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let content;
    try {
      content = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response as JSON:", cleaned);
      return new Response(JSON.stringify({ error: "Failed to parse content. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-studio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
