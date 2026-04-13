import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContentGenerationRequest {
  prompt: string;
  contentType: string;
  platforms: string[];
  tone?: string;
  style?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

/**
 * Format content for different platforms
 */
function formatForPlatforms(
  content: string,
  platforms: string[]
): Record<string, string> {
  const formatted: Record<string, string> = {};

  const platformConfigs: Record<string, { maxLength: number }> = {
    tiktok: { maxLength: 2200 },
    instagram: { maxLength: 2200 },
    twitter: { maxLength: 280 },
    linkedin: { maxLength: 3000 },
    facebook: { maxLength: 63206 },
    pinterest: { maxLength: 500 },
    youtube: { maxLength: 5000 },
    blog: { maxLength: 100000 },
  };

  for (const platform of platforms) {
    const config = platformConfigs[platform] || { maxLength: 1000 };
    let platformContent = content;

    if (platformContent.length > config.maxLength) {
      platformContent = platformContent.substring(0, config.maxLength - 3) + "...";
    }

    formatted[platform] = platformContent;
  }

  return formatted;
}

/**
 * Call AI to generate content
 */
async function generateContentWithAI(
  prompt: string,
  tone: string,
  style: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const systemPrompt = `You are a professional content creator. Generate high-quality content with the following characteristics:
- Tone: ${tone}
- Style: ${style}
- Engaging and platform-ready
- Include relevant hashtags where appropriate`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ContentGenerationRequest = await req.json();
    const { prompt, contentType, platforms, tone = "professional", style = "standard", templateId, variables } = requestData;

    if (!prompt || !contentType || !platforms || platforms.length === 0) {
      return new Response(
        JSON.stringify({
          error: "prompt, contentType, and platforms are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract user ID
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
        }
      }
    }

    // Generate content using AI
    const generatedContent = await generateContentWithAI(prompt, tone, style);

    // Format for platforms
    const formattedContent = formatForPlatforms(generatedContent, platforms);

    // Save to database
    if (userId) {
      const { error: insertError } = await supabaseClient
        .from("content_generations")
        .insert({
          user_id: userId,
          prompt,
          generated_content: generatedContent,
          platforms,
          output_format: "text",
          model_used: "gpt-4.1-mini",
          tokens_used: Math.ceil(generatedContent.length / 4),
          cost: 0.001,
          status: "completed",
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error saving content generation:", insertError);
      }

      // Increment usage
      await supabaseClient.rpc("increment_usage", {
        p_user_id: userId,
        p_tokens: Math.ceil(generatedContent.length / 4),
        p_cost: 0.001,
        p_content_count: 1,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        prompt,
        generatedContent,
        formattedContent,
        platforms,
        tone,
        style,
        createdAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in content studio:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
