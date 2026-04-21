# Alterai.im — Master Recreation Prompt

Use this prompt to recreate the **Alterai.im** AI content platform from scratch in Emergent (or any AI app builder). Follow every section.

---

## 1. Product Vision

Build **Alterai.im**, a TikTok-first AI content studio that helps creators generate **sellable, ready-to-publish** content (scripts, scenes, videos, images, chatbots) across multiple platforms — with no watermarks, no BYOK, and a soft-dark premium aesthetic.

Core philosophy:
- **Sellable output** — every generation should be usable without further editing.
- **Smart context** — remember user style, story, and preferences across sessions.
- **Cross-platform ready** — TikTok, Instagram Reels, YouTube Shorts, X, LinkedIn.
- **TikTok-friendly only** — no explicit, harmful, or policy-violating content.

---

## 2. Tech Stack

- **Frontend**: React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui
- **Routing**: react-router-dom v6
- **State/Data**: @tanstack/react-query, React Context for auth/subscription
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions in Deno)
- **Payments**: Stripe (subscriptions + one-time bot purchases) via Stripe webhooks
- **AI**: Internal gateway only — no user API keys. Models routed server-side via Edge Functions (Gemini, GPT, Claude families).
- **Voice**: ElevenLabs TTS for scene voiceovers
- **SEO**: react-helmet-async, sitemap.xml, robots.txt, JSON-LD
- **Testing**: Vitest + Playwright

---

## 3. Design System

**Aesthetic**: Soft dark (deep navy/charcoal) with **pink accents**. Apple-like minimalism. Generous spacing. Subtle gradients. No harsh blacks.

**All colors must be HSL semantic tokens** in `src/index.css` and `tailwind.config.ts`. Never use raw `text-white` / `bg-black` in components.

```css
:root {
  --background: 240 15% 8%;
  --foreground: 0 0% 98%;
  --primary: 330 85% 62%;          /* pink */
  --primary-foreground: 0 0% 100%;
  --secondary: 240 12% 14%;
  --muted: 240 10% 18%;
  --accent: 320 80% 70%;
  --border: 240 10% 22%;
  --gradient-primary: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)));
  --shadow-elegant: 0 10px 30px -10px hsl(var(--primary) / 0.3);
}
```

**Typography**: Inter for body, tight tracking for headings.
**Branding**: "Alterai.im" wordmark, lowercase-friendly.
**Previews**: Use **static text only** — never typing animations (causes layout shift).
**Empty states**: Always pre-populate with high-quality default content.

---

## 4. Routes & Pages

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Hero, social proof, feature grid, pricing teaser |
| `/auth` | Auth | Email + Google sign-in/sign-up |
| `/dashboard` | Dashboard | User overview, recent creations |
| `/content-creator` | ContentCreator | TikTok-first script + scene + video pipeline |
| `/content-studio` | ContentStudio | Multi-platform batch generation |
| `/companions` | Companions | Browse premade + user chatbots |
| `/companions/:id` | CompanionProfile | Bot detail, reviews, purchase |
| `/chat/:botId` | Chat | Persistent-memory chat with bot |
| `/art-studio` | ArtStudio | AI image generation |
| `/graffiti-studio` | GraffitiStudio | Canvas drawing + AI remix (Enhance/Restyle/Upscale) |
| `/graffiti-gallery` | GraffitiGallery | Public graffiti feed with likes |
| `/marketplace` | Marketplace | Paid bots |
| `/templates` | TemplateMarketplace | Public + private content templates |
| `/my-creations` | MyCreations | User's saved .webm/images |
| `/pricing` | Pricing | Stripe-backed plans |
| `/profile` | Profile | Account settings, avatar |
| `/purchases` | Purchases | One-time bot purchases |
| `/admin` | AdminDashboard | Platform analytics (admin role only) |
| `/legal/*` | LegalPage | Terms, privacy, DMCA, cookies, etc. |

---

## 5. Database Schema (Supabase / Postgres)

All user-data tables: **RLS ON**. Users see only their own rows. Admin via `has_role()` security definer function.

### Tables
- `profiles` — id (uuid, fk auth.users), username, avatar_url
- `user_roles` — id, user_id, role (enum: admin|moderator|user) — **separate table; never store role on profiles**
- `user_usage` — user_id, messages_used_today, images_used_today, bonus_messages, last_reset_date
- `subscriptions` — user_id, stripe_customer_id, stripe_subscription_id, status, price_id, period_end, cancel_at_period_end
- `bots` — id, user_id, name, description, persona, avatar_url, model, category, is_premium, is_public, price, premium_free_messages, suggested_prompts[], messages_count, status
- `bot_reviews` — bot_id, user_id, rating, comment
- `favorites` — user_id, bot_id
- `messages` — bot_id, user_id, role, content, created_at
- `purchases` — user_id, bot_id, amount, stripe_session_id
- `content_templates` — user_id, name, category, prompt, content (jsonb), platforms[], story_profile (jsonb), is_public, use_count
- `user_creations` — user_id, type, title, file_url, thumbnail_url, metadata (jsonb)
- `video_style_presets` — user_id, name, style (jsonb)
- `graffiti` — user_id, title, image_url, likes_count
- `graffiti_likes` — user_id, graffiti_id
- `referrals` — referrer_id, referred_id, referral_code, rewarded

### Functions
- `has_role(_user_id, _role)` — SECURITY DEFINER, used in all admin RLS policies
- `get_or_reset_usage(p_user_id)` — daily reset
- `increment_usage(p_user_id, p_type)` — atomic counter
- `increment_bot_messages(bot_id_input)`
- `get_bot_analytics(owner_id)` — per-bot stats
- `get_platform_stats()` — admin metrics

### Storage Buckets
- `user-creations` — **private**, holds .webm videos and images, no watermarks
- `bot-avatars` — public read
- `graffiti` — public read

---

## 6. Edge Functions (Deno)

All AI/payment logic runs in Edge Functions. Frontend never calls AI providers directly.

| Function | Purpose |
|---|---|
| `chat` | Single-shot chat |
| `chat-with-memory` | Chat with conversation history injection |
| `ai-engine-v2` | Main AI router with tier-based model selection |
| `content-studio` / `content-studio-v2` | Multi-platform script + scene generation |
| `generate-image` | Image generation |
| `elevenlabs-tts` | Voiceover synthesis |
| `agent-actions` | Tool/workflow execution |
| `job-queue-worker` | Background jobs |
| `usage-tracking` | Limit enforcement + recording |
| `create-checkout` | Stripe subscription checkout |
| `create-bot-checkout` | One-time bot purchase |
| `customer-portal` | Stripe billing portal |
| `check-subscription` | Sync subscription state |
| `check-bot-purchase` | Verify one-time purchase |
| `stripe-webhook` | Subscription/purchase webhook handler |
| `referral` | Referral attribution + rewards |
| `admin-analytics` | Admin dashboard stats |
| `template-marketplace` | Template CRUD + publishing |
| `seed-templates` | Seed bi-weekly official templates |

---

## 7. Key Features

### Content Studio
- Multi-platform output (TikTok, Reels, Shorts, X, LinkedIn, YouTube)
- **Inline script editing** — edit any scene's text, regenerate just that scene
- **Story continuation** — remembers prior scenes, characters, hooks
- Tiered output quality based on subscription
- Video compilation via `MediaRecorder` → .webm, real-time-throttled
- Saves to `user-creations` bucket (private, no watermark)

### Companions (Chatbots)
- Premade bots with **ultra-realistic portrait avatars**
- User-created custom bots with persona, suggested prompts, voice settings
- Persistent conversation memory (extracts topics, preferences, style)
- Marketplace with Stripe one-time purchases + reviews
- Voice replies via ElevenLabs

### Graffiti Studio
- HTML canvas drawing tool (brush, eraser, colors, undo)
- AI remix actions: **Enhance**, **Restyle**, **Upscale** (Gemini image)
- Public gallery with likes
- **No BYOK** — fully internal API

### Templates Marketplace
- User-saved templates (private by default)
- Publishable to public marketplace
- Categories + use_count tracking
- Bi-weekly **official** templates seeded by admin

### Monetization
- **Free**: low daily quota
- **Pro**: monthly Stripe subscription, expanded quota
- **Power**: highest quota + premium models
- One-time bot purchases via Stripe Checkout
- Referral rewards (bonus messages)
- Usage tracked per-user, daily reset

---

## 8. Security Rules (Critical)

- **RLS strictly enforced** on every user-data table
- Roles in **separate `user_roles` table** — never on `profiles`
- All role checks via `has_role()` SECURITY DEFINER function
- Auth lockouts after repeated failures
- HIBP password breach check on signup
- Standard email + Google OAuth — **never anonymous sign-ups**
- Email verification required before sign-in (do not auto-confirm)
- Sensitive secrets only in Edge Function env (Stripe, ElevenLabs, AI keys)
- Frontend uses only the publishable anon key

---

## 9. SEO & Performance

- `react-helmet-async` `<SEO>` component on every page
- Title <60 chars with keyword; meta description <160 chars
- Single H1 per page, semantic HTML
- JSON-LD for Organization + Product (bots) + Article (templates)
- Alt text on all images, lazy loading, responsive viewport
- `public/sitemap.xml` + `public/robots.txt`
- Canonical URLs

---

## 10. Hard Constraints (Do NOT violate)

1. **Never** use typing animations in output previews — static text only.
2. **Never** apply watermarks to any generated content.
3. **Never** re-add BYOK (Bring Your Own Key) for OpenAI or Graffiti Studio.
4. **Never** allow content that violates TikTok policies (no explicit/harmful).
5. **Never** store roles on the `profiles` or users table.
6. **Never** edit Supabase auto-generated client/types files.
7. **Always** pre-populate UI sections — no empty states.
8. **Always** use HSL semantic tokens, never raw color classes in components.

---

## 11. Build Order (Suggested)

1. Scaffold Vite + React + TS + Tailwind + shadcn
2. Set up Supabase project, auth, profiles, user_roles, RLS
3. Build design system (index.css tokens + tailwind.config.ts)
4. Auth pages + protected routes
5. Companions + Chat (with memory)
6. Content Studio + video compiler
7. Graffiti Studio + gallery
8. Templates Marketplace
9. Stripe subscriptions + bot purchases + webhooks
10. Usage tracking + quota enforcement
11. Admin dashboard
12. SEO polish + legal pages + sitemap

---

**End of master prompt. Build to spec.**
