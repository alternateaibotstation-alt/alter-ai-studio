# ONE-Stop AI Platform

## Platform Overview

ONE-Stop is a creator-first AI platform designed to empower content creators and AI entrepreneurs. It provides a comprehensive suite of tools to build, launch, and monetize AI bots, generate multi-platform content (text, image, video, voice), and automate various creative tasks. Our goal is to streamline the content creation workflow, allowing users to produce high-quality, platform-optimized content efficiently and profitably.

## Key Features

*   **AI Bot Builder:** Create custom AI personalities with unique voices, knowledge, and behaviors. Bots can remember past creations (tones, avatars, products) to ensure continuity across content. Publish your bots to the marketplace or keep them private for your audience.
*   **Multi-Platform Content Generation:** Generate optimized content for various social media platforms including TikTok, Instagram, LinkedIn, Twitter, Facebook, and Pinterest from a single prompt.
*   **Voice & Video Studio:** Produce AI voiceovers and compile videos, enhancing your content with dynamic multimedia elements.
*   **Credit System:** A transparent credit system governs usage across the platform, allowing for flexible consumption of AI services.
*   **Bring Your Own Key (BYOK):** Users have the option to integrate their own OpenAI or Gemini API keys, bypassing platform usage limits and potentially reducing costs.
*   **Template Marketplace:** Access a library of daily updated, copy-and-paste fillable templates based on trending content for each platform. Creators can also build and sell their own templates, fostering a vibrant community and new revenue streams.

## How It Works

1.  **Create Your AI Bot:** Define your bot's personality, knowledge base, and behavior. Train it to understand your brand's unique voice and style.
2.  **Generate Content:** Use your custom bot or select from a range of pre-built tools to generate text, images, voiceovers, or even full video compilations. Leverage our template marketplace for trending ideas.
3.  **Optimize & Publish:** ONE-Stop automatically optimizes your content for various social media platforms. Review, refine, and publish directly to your desired channels.
4.  **Monetize & Scale:** Track your bot's performance, user engagement, and revenue through our intuitive dashboard. Monetize your creations through flexible pricing models and scale your content empire.

## Cost Optimization Strategy

ONE-Stop employs a sophisticated AI routing system to optimize costs while maintaining high-quality output:

*   **Hybrid Model Routing:** Requests are intelligently routed between Google Gemini (for cost-effectiveness and high-volume tasks) and OpenAI (for superior quality and complex reasoning).
    *   **Free Users:** All requests are routed to Gemini to minimize operational costs.
    *   **Pro Users:** Benefit from hybrid routing, balancing cost and quality based on task requirements.
    *   **Power Users:** Prioritize OpenAI for premium outputs, with fallback to Gemini for less critical tasks.
    *   **Emotional/Conversational Tasks:** Primarily handled by OpenAI for nuanced interactions.
    *   **Bulk Content Generation:** Optimized for Gemini to ensure efficiency and cost savings.
*   **Credit Usage & Profit Margin:** Each AI request consumes credits, which are priced to ensure a minimum 18% profit margin. Dynamic markup is applied based on user tier and model used.
*   **BYO API Key:** Users providing their own API keys incur no platform cost for those specific requests, offering them maximum control over their spending.
*   **Failsafes:** The system includes mechanisms to block requests if credits are exhausted, throttle excessive usage, and automatically fallback to cheaper models if primary options are unavailable or too costly.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, TailwindCSS
*   **Backend:** Supabase (Auth, Database, Edge Functions)
*   **AI Models:** Google Gemini, OpenAI
*   **Payments:** Stripe

## Installation Instructions & Environment Variables

To set up the ONE-Stop platform locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/alternateaibotstation-alt/alter-ai-studio.git
    cd alter-ai-studio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env.local` file in the root directory and populate it with your Supabase and other API keys. Refer to `.env.example` for required variables.
    ```
    # Supabase
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

    # Stripe
    VITE_STRIPE_PUBLIC_KEY=YOUR_STRIPE_PUBLIC_KEY

    # OpenAI (optional, for BYOK)
    VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY

    # Google Gemini (optional, if not using Supabase Edge Functions for Gemini)
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Legal & Compliance Notice

This project is proprietary and all rights are reserved by Carley B. Lenon. Unauthorized copying, modification, distribution, or commercial use is strictly prohibited. For detailed legal terms, please refer to the `legal/` directory.

## Contributing Instructions

Currently, contributions are not open to the public. Please contact the owner for any collaboration inquiries.

## Contact & Support Info

For inquiries, support, or collaboration, please contact: carleylenon@gmail.com

---

© 2026 Carley B. Lenon. All rights reserved.

This repository and all its contents, including code, documentation, and assets, are proprietary.
No part of this repository may be copied, modified, distributed, or used for commercial purposes
without express written permission from Carley B. Lenon.

For inquiries, contact: carleylenon@gmail.com
