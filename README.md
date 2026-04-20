# Alterai.im — AI Studio for Creators

> **Live site:** [https://alterai.im](https://alterai.im)
> **Owner:** Carley Lenon — sole owner and operator
> **Contact:** [alternateaibotstation@gmail.com](mailto:alternateaibotstation@gmail.com)

Alterai.im is a creator-first AI platform for building AI companions, generating multi-platform content (TikTok, Instagram, YouTube, X, Facebook, Pinterest, LinkedIn), producing AI voiceovers, and selling templates — all from one dashboard. No API keys required.

---

## ✨ Features

- **AI Companions** — Chat with built-in ultra-realistic personas or create and sell your own.
- **Content Studio** — Generate hooks, scripts, captions, hashtags, and full TikTok-ready scenes from a single prompt.
- **Image & Video Studio** — AI image generation, scene compiling, and on-canvas editing (Graffiti Studio).
- **Voiceover** — ElevenLabs-powered TTS for narration and TikTok scenes.
- **Templates Marketplace** — Buy, sell, and remix high-converting templates. Bi-weekly official drops.
- **My Creations** — Private, watermark-free storage of every video, image, and chat output.
- **Subscriptions & One-off Purchases** — Stripe-powered Free / Pro / Power tiers plus pay-per-bot.
- **Referrals** — Reward users with bonus messages for inviting friends.
- **Admin Dashboard** — Platform analytics, user management, and template moderation.

## 🏗 Architecture

```
Browser (Vite + React SPA, hosted on Vercel)
        │
        ▼
Lovable Cloud (Supabase)
  ├── Auth (email/password + Google)
  ├── Postgres + Row-Level Security
  ├── Storage (private user-creations bucket)
  └── Edge Functions
        ├── chat / chat-with-memory
        ├── content-studio / content-studio-v2
        ├── ai-engine-v2 (model routing)
        ├── generate-image
        ├── elevenlabs-tts
        ├── create-checkout / create-bot-checkout
        ├── stripe-webhook
        ├── customer-portal
        ├── usage-tracking
        ├── referral
        └── admin-analytics
```

All third-party secrets (OpenAI, Gemini, ElevenLabs, Stripe) live **only** inside Supabase Edge Functions. Nothing sensitive is exposed to the browser.

## 🔧 Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript, TailwindCSS, shadcn/ui, Framer Motion
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions / Deno)
- **AI:** OpenAI GPT-5 family, Google Gemini 2.5 / 3.x, ElevenLabs TTS — routed internally by tier
- **Payments:** Stripe (Checkout + Customer Portal + Webhooks)
- **Hosting:** Vercel (frontend) + Lovable Cloud (backend)
- **Domain:** alterai.im

## 🚀 Deployment

The project is deployed two ways:

| Environment | URL | Notes |
|---|---|---|
| **Production (custom domain)** | [alterai.im](https://alterai.im) | Vercel-hosted, auto-deploys from `main` |
| **Lovable preview** | `*.lovable.app` | Auto-deploys on every Lovable edit |

### Required Vercel Environment Variables

Only **3** variables are needed on Vercel — everything else lives in Lovable Cloud / Supabase:

```
VITE_SUPABASE_URL=https://celvxwiympkuceitdgxo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=celvxwiympkuceitdgxo
```

Do **not** put `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `DATABASE_URL` on Vercel — they belong in Lovable Cloud's Edge Function secrets only.

### `vercel.json`

The repo includes a `vercel.json` that:
- Sets the build command (`npm run build`) and output directory (`dist`)
- Adds an SPA rewrite so React Router deep links work on refresh

## 💻 Local Development

```bash
git clone https://github.com/alternateaibotstation-alt/alter-ai-studio.git
cd alter-ai-studio
npm install
npm run dev
```

Create a `.env.local` with the same 3 `VITE_SUPABASE_*` vars listed above (also auto-provided by Lovable).

## 📜 Legal & Policies

All policies are in the `legal/` directory and rendered live at `/legal/<slug>`:

- [Terms of Service](legal/terms.md)
- [Privacy Policy](legal/privacy.md)
- [Cookie Policy](legal/cookies.md)
- [Acceptable Use Policy](legal/acceptable-use.md)
- [Content Policy](legal/content-policy.md)
- [Community Guidelines](legal/community.md)
- [DMCA Policy](legal/dmca.md)
- [Disclaimer](legal/disclaimer.md)
- [Payment & Refund Policy](legal/payment-policy.md)
- [API Usage Policy](legal/api-usage.md)

A public [FAQ](https://alterai.im/faq) covers billing, content rights, and support.

## 📄 License & Ownership

**Alterai.im is proprietary software, solely owned and operated by Carley Lenon.**

© 2024–2026 Carley Lenon. All rights reserved. No part of this repository — including code, design, brand assets, prompts, or documentation — may be copied, modified, redistributed, sublicensed, sold, or used to train derivative models or competing products without prior written permission from the owner.

This repository is published for transparency and continuous deployment only. It is **not** open source.

## 📬 Contact

- **Owner:** Carley Lenon
- **Email:** [alternateaibotstation@gmail.com](mailto:alternateaibotstation@gmail.com)
- **Site:** [https://alterai.im](https://alterai.im)

For business inquiries, partnerships, DMCA notices, or support requests, email the address above. Response time: 1–2 business days.
