import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_TEMPLATES = [
  // ── TikTok ──
  {
    name: "TikTok: AI Productivity Hack",
    category: "tech",
    platforms: ["tiktok"],
    prompt: "Create a viral TikTok about an AI productivity hack that saves hours daily",
    content: {
      tiktok: {
        hook: "I replaced 4 hours of work with 1 AI prompt. Here's how 👇",
        caption: "Stop doing everything manually. This AI trick automates your content, emails, and research in seconds.\n\n🧠 Step 1: Pick one repetitive task\n⚡ Step 2: Use an AI bot to handle it\n📈 Step 3: Scale it across platforms\n\nThe future isn't coming — it's already here.",
        visual_prompt: "Fast-paced screen recording showing an AI tool generating content in real-time, split-screen before/after of manual vs automated work, trendy zoom cuts with text overlays",
        cta: "Follow for more AI hacks that actually work 🤖",
        hashtags: "#AIHacks #Productivity #WorkSmarter #TechTok #Automation"
      }
    }
  },
  {
    name: "TikTok: Day in My Life as AI Creator",
    category: "lifestyle",
    platforms: ["tiktok"],
    prompt: "Show a day in the life of someone using AI to create content across platforms",
    content: {
      tiktok: {
        hook: "POV: You make content for 6 platforms in 10 minutes ⏱️",
        caption: "My morning routine as an AI content creator:\n\n☕ 7am: Coffee + one prompt\n🎬 7:10am: Content for TikTok, IG, LinkedIn, Twitter, FB, Pinterest — done\n🏖️ 7:15am: Rest of the day is mine\n\nThis is what happens when you let AI do the heavy lifting.",
        visual_prompt: "Aesthetic morning routine montage — person at desk with laptop, satisfying UI clicks generating content, calendar filling up with scheduled posts, ending with person relaxing",
        cta: "Link in bio to try it yourself ✨",
        hashtags: "#ContentCreator #DITL #AITools #CreatorEconomy #Lifestyle"
      }
    }
  },
  // ── Instagram ──
  {
    name: "Instagram: Build Your AI Brand",
    category: "marketing",
    platforms: ["instagram"],
    prompt: "Create an Instagram carousel about building a personal brand with AI tools",
    content: {
      instagram: {
        hook: "Your brand doesn't need a team. It needs AI. 🚀",
        caption: "I went from 0 to consistent content on 6 platforms — without hiring anyone.\n\nHere's the framework:\n\n1️⃣ Define your niche voice\n2️⃣ Create one AI bot that writes like you\n3️⃣ Generate platform-specific content from a single idea\n4️⃣ Schedule everything in one session\n5️⃣ Track what performs and double down\n\nThe creators winning in 2026 aren't working harder.\nThey're building smarter systems.\n\n💬 Save this for later.",
        visual_prompt: "Clean carousel slides with bold typography on dark gradient backgrounds, each slide covering one step, minimalist icons, brand color accents in purple and blue",
        cta: "Save 🔖 + Follow for more AI strategies",
        hashtags: "#PersonalBranding #AIMarketing #ContentStrategy #CreatorTools #DigitalMarketing #GrowthHacking"
      }
    }
  },
  {
    name: "Instagram: Behind the Scenes",
    category: "entertainment",
    platforms: ["instagram"],
    prompt: "Create a behind-the-scenes Instagram Reel showing AI content creation",
    content: {
      instagram: {
        hook: "What it actually looks like to create a week of content in 15 minutes 👀",
        caption: "People ask me how I stay so consistent.\n\nThe truth? I batch everything with AI.\n\nOne prompt → six platforms → done.\nThen I spend the rest of my time actually living.\n\nNo burnout. No content anxiety.\nJust a system that works.\n\n🎯 Drop a '🤖' if you want me to share my exact workflow.",
        visual_prompt: "Phone screen recording of the content generation process, aesthetic desk setup with warm lighting, quick cuts showing content appearing for each platform, reaction shot of creator looking satisfied",
        cta: "Comment '🤖' for my free workflow guide",
        hashtags: "#BTS #ContentCreation #AIContent #ReelsViral #CreatorLife #WorkflowTips"
      }
    }
  },
  // ── Facebook ──
  {
    name: "Facebook: AI Success Story",
    category: "business",
    platforms: ["facebook"],
    prompt: "Write a Facebook post sharing a relatable AI success story that drives engagement",
    content: {
      facebook: {
        hook: "6 months ago, I was spending 4 hours a day on social media content. Today, I spend 15 minutes.",
        caption: "Here's what changed:\n\nI stopped trying to be everywhere manually and started using AI to work smarter.\n\nNow I write one prompt, and my AI generates optimized posts for TikTok, Instagram, LinkedIn, Twitter, Facebook, and Pinterest.\n\nThe result?\n✅ More consistent posting\n✅ Better engagement (because each post is platform-native)\n✅ 3 extra hours every single day\n✅ Zero burnout\n\nIf you're a creator, small business owner, or marketer still doing everything by hand — there's a better way.\n\nThe tools exist. You just have to start using them.\n\nWho else needs to hear this? Tag them below 👇",
        visual_prompt: "Split image: left side shows stressed person surrounded by social media icons, right side shows relaxed person with a single AI dashboard, clean modern design",
        cta: "Tag a friend who needs this 👇",
        hashtags: ""
      }
    }
  },
  {
    name: "Facebook: Question Post — AI Debate",
    category: "general",
    platforms: ["facebook"],
    prompt: "Create a thought-provoking Facebook engagement post about AI in content creation",
    content: {
      facebook: {
        hook: "Honest question: Do you think AI-generated content can be authentic?",
        caption: "I've been thinking about this a lot.\n\nSome people say AI content is 'fake' or 'lazy.'\nOthers say it's the smartest way to scale.\n\nHere's my take:\n\nAI doesn't replace your voice — it amplifies it.\n\nYou still bring the ideas, the perspective, the personality. AI just helps you share it faster, on more platforms, without burning out.\n\nIt's like using a microphone instead of shouting.\n\nBut I want to hear YOUR opinion.\n\n🅰️ AI content can absolutely be authentic\n🅱️ Nothing beats 100% human-written content\n🅲️ It depends on how you use it\n\nDrop your answer below 👇",
        visual_prompt: "Bold text overlay on gradient background asking the question, clean modern typography, conversation-starter design with A/B/C options visible",
        cta: "Vote in the comments! 🗳️",
        hashtags: ""
      }
    }
  },
  // ── Pinterest ──
  {
    name: "Pinterest: AI Tools Infographic",
    category: "tech",
    platforms: ["pinterest"],
    prompt: "Create a Pinterest pin about the best AI tools for content creators in 2026",
    content: {
      pinterest: {
        hook: "Top 5 AI Tools Every Content Creator Needs in 2026",
        caption: "Stop wasting time creating content manually. These AI tools will transform your workflow:\n\n1. AI Bot Builders — Create custom AI personalities for your brand\n2. Multi-Platform Generators — One prompt, six platforms\n3. AI Voice Studios — Professional voiceovers in seconds\n4. Smart Analytics — Know exactly what's working\n5. Template Libraries — Never start from scratch\n\n📌 Save this pin for your next content planning session!",
        visual_prompt: "Tall Pinterest-optimized infographic (2:3 ratio) with numbered list, modern icons for each tool, dark theme with purple/blue gradient accents, clean sans-serif typography, AlterAI branding subtle at bottom",
        cta: "Save for later 📌",
        hashtags: ""
      }
    }
  },
  {
    name: "Pinterest: Content Calendar Template",
    category: "marketing",
    platforms: ["pinterest"],
    prompt: "Design a Pinterest pin promoting a free AI-powered content calendar strategy",
    content: {
      pinterest: {
        hook: "Your Free AI Content Calendar for 2026 📅",
        caption: "Plan a full month of content in 30 minutes using AI:\n\nWeek 1: Educational content (how-tos, tips)\nWeek 2: Behind-the-scenes + personal stories\nWeek 3: Engagement posts (polls, questions, debates)\nWeek 4: Promotional + CTA-driven content\n\n🔁 Repeat monthly. Let AI generate the actual posts.\n\nThis simple framework keeps your content diverse, consistent, and on-brand across every platform.\n\n📌 Pin this to your Content Strategy board!",
        visual_prompt: "Clean calendar-style layout pin with 4 weeks color-coded, minimal design, pastel accent colors on dark background, each week labeled with content type and matching icon",
        cta: "Pin to your Strategy board 📌",
        hashtags: ""
      }
    }
  },
  // ── LinkedIn ──
  {
    name: "LinkedIn: The Creator's Dilemma",
    category: "business",
    platforms: ["linkedin"],
    prompt: "Write a LinkedIn thought leadership post about the creator economy and AI",
    content: {
      linkedin: {
        hook: "The biggest lie in the creator economy: 'Just post more.'",
        caption: "Here's the truth nobody talks about:\n\nPosting more doesn't work if every post is mediocre.\n\nWhat works is posting smarter:\n→ One strong idea, adapted for each platform\n→ Platform-native formatting (not copy-paste)\n→ Consistent voice across every channel\n→ Data-driven iteration\n\nI used to spend 20+ hours per week on content.\nNow I spend 3.\n\nThe difference? I built a system using AI.\n\nNot to replace my thinking — but to eliminate the busywork.\n\nThe best creators in 2026 won't be the ones who grind the hardest.\nThey'll be the ones who build the best systems.\n\nAgree? ♻️ Repost if this resonates.",
        visual_prompt: "Professional clean text post design, no image needed — pure text LinkedIn format. If visual: minimalist quote card with the hook text on subtle gradient background",
        cta: "♻️ Repost to help another creator",
        hashtags: "#ContentCreation #AI #CreatorEconomy #Productivity #PersonalBranding"
      }
    }
  },
  {
    name: "LinkedIn: AI ROI Breakdown",
    category: "business",
    platforms: ["linkedin"],
    prompt: "Create a LinkedIn post with concrete ROI numbers from using AI for content",
    content: {
      linkedin: {
        hook: "I tracked my content ROI for 90 days after switching to AI tools. Here are the numbers:",
        caption: "Before AI:\n• 4 hours/day on content creation\n• 3 platforms covered\n• Inconsistent posting schedule\n• Engagement: flat\n\nAfter AI:\n• 30 minutes/day\n• 6 platforms covered\n• Daily posting on all channels\n• Engagement: up 340%\n\nThe math is simple:\n\nTime saved: ~24 hours/week\nPlatforms added: 2x\nConsistency: 100%\nCost: Less than one freelancer's hourly rate\n\nAI isn't a luxury for creators anymore.\nIt's a competitive advantage.\n\nIf you're still creating content the old way, you're leaving time and money on the table.\n\nWhat's holding you back from trying AI tools? Let me know below 👇",
        visual_prompt: "Clean before/after comparison graphic, professional LinkedIn style, data visualization with simple bar charts or metrics cards, dark corporate-friendly design",
        cta: "Share your experience below 👇",
        hashtags: "#ROI #AITools #ContentMarketing #DataDriven #CreatorEconomy"
      }
    }
  },
  // ── Twitter/X ──
  {
    name: "Twitter/X: Viral AI Thread Hook",
    category: "tech",
    platforms: ["twitter"],
    prompt: "Write a viral Twitter/X thread about how AI is changing content creation",
    content: {
      twitter: {
        hook: "I create content for 6 platforms in under 10 minutes. No team. No scheduling tool. Just AI.\n\nHere's the exact system (thread) 🧵👇",
        caption: "1/ The old way: Write a post → manually reformat for each platform → spend 4 hours → burnout\n\nThe new way: One prompt → AI generates platform-native content → 10 minutes → done\n\n2/ The key insight: Each platform has different rules.\nTikTok wants hooks. LinkedIn wants value. Twitter wants punchy lines.\n\nAI handles the translation. You handle the ideas.\n\n3/ My workflow:\n→ Morning: Write one idea in 2 sentences\n→ AI generates TikTok, IG, LinkedIn, Twitter, FB, Pinterest versions\n→ Review + tweak (2 min)\n→ Schedule everything\n→ Go live my life\n\n4/ Results after 90 days:\n• 6x more content output\n• 340% engagement increase\n• 24 hours/week saved\n• Zero burnout\n\n5/ The creators who win in 2026 won't work harder.\nThey'll build better systems.\n\nAI is the system.\n\nIf this was helpful, RT the first tweet and follow for more 🤝",
        visual_prompt: "No image needed for Twitter thread. If visual: simple metric card showing the time-saved stats with clean modern design",
        cta: "RT + Follow for more AI creator tips 🤝",
        hashtags: ""
      }
    }
  },
  {
    name: "Twitter/X: Hot Take on AI Content",
    category: "motivation",
    platforms: ["twitter"],
    prompt: "Write a punchy, curiosity-driven tweet about AI and authenticity",
    content: {
      twitter: {
        hook: "Unpopular opinion: AI-generated content is more authentic than most 'handcrafted' content.\n\nWhy? Because people using AI actually have time to think about WHAT to say instead of spending all day figuring out HOW to format it.\n\nThe best ideas deserve the best distribution.\nAI is just the vehicle. 🚗",
        caption: "The debate isn't 'AI vs human content.'\n\nIt's 'good ideas with reach' vs 'great ideas nobody sees.'\n\nAI solves the distribution problem.\nYour brain still handles the thinking.\n\nStop gatekeeping tools that make creators' lives easier.",
        visual_prompt: "Bold single quote graphic with the hot take text, dark background, neon accent color, minimal design optimized for Twitter card preview",
        cta: "Agree or disagree? QRT with your take 🔥",
        hashtags: ""
      }
    }
  }
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action } = await req.json().catch(() => ({ action: "seed" }));

    if (action === "refresh") {
      // Delete old system templates (where user_id is the system ID)
      const { data: existing } = await supabase
        .from("content_templates")
        .select("id, user_id")
        .eq("is_public", true)
        .eq("user_id", "00000000-0000-0000-0000-000000000000");

      if (existing && existing.length > 0) {
        const ids = existing.map((t: any) => t.id);
        await supabase.from("content_templates").delete().in("id", ids);
      }
    }

    // Insert all templates with system user ID
    const toInsert = SYSTEM_TEMPLATES.map((t) => ({
      ...t,
      user_id: "00000000-0000-0000-0000-000000000000",
      is_public: true,
      use_count: 0,
    }));

    const { data, error } = await supabase
      .from("content_templates")
      .insert(toInsert)
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: data.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
