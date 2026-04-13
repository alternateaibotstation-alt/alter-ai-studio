import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatRequest {
  botId: string;
  conversationId?: string;
  message: string;
  context?: Record<string, any>;
}

/**
 * Extract key topics from messages
 */
function extractKeyTopics(messages: Array<{ role: string; content: string }>): string[] {
  const topics: Set<string> = new Set();
  const keywords = [
    "project",
    "feature",
    "bug",
    "design",
    "performance",
    "security",
    "deployment",
    "testing",
    "documentation",
    "api",
    "database",
    "frontend",
    "backend",
    "mobile",
    "web",
  ];

  messages.forEach((msg) => {
    const content = msg.content.toLowerCase();
    keywords.forEach((keyword) => {
      if (content.includes(keyword)) {
        topics.add(keyword);
      }
    });
  });

  return Array.from(topics).slice(0, 5);
}

/**
 * Analyze conversation style
 */
function analyzeConversationStyle(
  messages: Array<{ role: string; content: string }>
): string {
  let formalCount = 0;
  let casualCount = 0;

  messages.forEach((msg) => {
    const content = msg.content.toLowerCase();

    if (
      content.includes("please") ||
      content.includes("thank") ||
      content.includes("regards")
    ) {
      formalCount++;
    }

    if (
      content.includes("hey") ||
      content.includes("lol") ||
      content.includes("cool") ||
      content.includes("awesome")
    ) {
      casualCount++;
    }
  });

  if (formalCount > casualCount) {
    return "professional";
  } else if (casualCount > formalCount) {
    return "casual";
  }
  return "neutral";
}

/**
 * Build contextual system prompt
 */
function buildContextualSystemPrompt(
  basePrompt: string,
  recentMessages: Array<{ role: string; content: string }>,
  keyTopics: string[],
  conversationStyle: string
): string {
  let prompt = basePrompt;

  if (recentMessages.length > 0) {
    prompt += `\n\n## Recent Conversation Context\n`;
    recentMessages.slice(-5).forEach((msg) => {
      prompt += `${msg.role}: ${msg.content.substring(0, 100)}...\n`;
    });
  }

  if (keyTopics.length > 0) {
    prompt += `\n\n## Key Topics Discussed\n${keyTopics.join(", ")}`;
  }

  prompt += `\n\n## Conversation Style\nMaintain a ${conversationStyle} tone to match the user's communication style.`;

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ChatRequest = await req.json();
    const { botId, conversationId, message, context } = requestData;

    if (!botId || !message) {
      return new Response(
        JSON.stringify({
          error: "botId and message are required",
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

    // Extract user info
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

    // Get or create conversation
    let finalConversationId = conversationId;
    let recentMessages: Array<{ role: string; content: string }> = [];

    if (finalConversationId && userId) {
      // Fetch existing conversation
      const { data: convData } = await supabaseClient
        .from("conversation_memory")
        .select("role, content")
        .eq("conversation_id", finalConversationId)
        .order("message_index", { ascending: true })
        .limit(20);

      if (convData) {
        recentMessages = convData.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    } else if (userId) {
      // Create new conversation
      const { data: newConv } = await supabaseClient
        .from("conversations")
        .insert({
          user_id: userId,
          bot_id: botId,
          title: `Chat - ${new Date().toLocaleDateString()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newConv) {
        finalConversationId = newConv.id;
      }
    }

    // Get bot persona
    const { data: bot } = await supabaseClient
      .from("bots")
      .select("*")
      .eq("id", botId)
      .single();

    if (!bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract key topics and conversation style
    const keyTopics = extractKeyTopics(recentMessages);
    const conversationStyle = analyzeConversationStyle(recentMessages);

    // Build contextual system prompt
    let systemPrompt = bot.persona || `You are ${bot.name}, a helpful assistant.`;
    systemPrompt = buildContextualSystemPrompt(
      systemPrompt,
      recentMessages,
      keyTopics,
      conversationStyle
    );

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      systemPrompt += "\n\n## Additional Context\n";
      Object.entries(context).forEach(([key, value]) => {
        systemPrompt += `${key}: ${JSON.stringify(value)}\n`;
      });
    }

    // Prepare messages for API
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call AI API
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    // Save user message to conversation
    if (userId && finalConversationId) {
      const messageCount = recentMessages.length + 1;
      await supabaseClient.from("conversation_memory").insert({
        conversation_id: finalConversationId,
        message_index: messageCount,
        role: "user",
        content: message,
        tokens_used: Math.ceil(message.length / 4),
        created_at: new Date().toISOString(),
      });

      // Update conversation timestamp
      await supabaseClient
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", finalConversationId);
    }

    // Create a custom stream that also saves the response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    let fullResponse = "";
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
            controller.enqueue(value);
          }

          // Save assistant response to conversation
          if (userId && finalConversationId) {
            const messageCount = recentMessages.length + 2;
            await supabaseClient.from("conversation_memory").insert({
              conversation_id: finalConversationId,
              message_index: messageCount,
              role: "assistant",
              content: fullResponse,
              tokens_used: Math.ceil(fullResponse.length / 4),
              created_at: new Date().toISOString(),
            });
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Conversation-ID": finalConversationId || "",
      },
    });
  } catch (error) {
    console.error("Error in chat with memory:", error);
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
