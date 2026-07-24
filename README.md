# Alterai.im — AI-Powered Creative Studio & Portfolio Platform

> **Live site:** [https://alterai.im](https://alterai.im)  
> **Owner:** Carley Lenon — sole owner and operator  
> **Contact:** [alternateaibotstation@gmail.com](mailto:alternateaibotstation@gmail.com)

Alterai.im is a comprehensive creative platform combining AI-powered content generation with a professional portfolio and asset management system. Generate, organize, edit, and distribute marketing content across multiple platforms from one unified dashboard.

---

## ✨ Core Features

### 🎬 AI-Powered Content Generation
- Generate marketing campaigns with AI assistance
- Video generation via fal.ai (Kling AI)
- Script and caption generation with OpenAI
- Prompt enhancement for better results
- Multi-format content creation

### 📁 Portfolio & Campaign Management
- **Campaign Library** — Organize and manage all generated campaigns
- **Asset Management** — Store and organize creative assets (images, videos, scripts, captions, documents)
- **Reusable Assets** — Use assets across multiple campaigns without duplication
- **Version Control** — Track asset versions and restore previous versions
- **Favorites System** — Mark and quickly access favorite campaigns and assets
- **Smart Search** — Full-text search with tagging and filtering

### 🎨 Canva-Style Creative Studio
- **Drag-and-Drop Canvas** — Intuitive visual editor for asset manipulation
- **Element Types** — Support for text, shapes, images, and videos
- **Layers & Z-Index** — Full layer management and ordering
- **Zoom Controls** — 50-200% zoom with real-time preview
- **Undo/Redo** — Complete editing history with unlimited undo/redo
- **Properties Panel** — Quick access to opacity, rotation, and positioning
- **Auto-Save** — Automatic draft saving with debounced updates

### 🌍 Multi-Platform Export
Automatically generate platform-specific versions with proper dimensions, aspect ratios, and specifications:

**Social Media:** TikTok, Instagram (Feed/Story/Reel), Facebook (Post/Story), YouTube (Shorts/Full), LinkedIn, X, Pinterest, Snapchat, Threads

**Other Platforms:** Email, Blog, Google Ads, Display Ads

**Export Formats:** PNG, JPG, WebP, MP4, GIF, SVG, PDF

**Smart Features:** Automatic dimension conversion with safe zones, platform best practices built-in

### 🔄 Universal Asset Manager
- **Asset Reuse** — Use any asset in multiple campaigns
- **Asset Remixing** — Mix and match assets from different campaigns
- **Collections** — Organize assets into custom collections
- **Brand Kits** — Create and apply consistent branding
- **Templates** — Save and reuse campaign templates
- **Metadata Management** — Tags, descriptions, and custom fields

### 👥 Team Collaboration (Coming Soon)
- Share campaigns with team members
- Comments and feedback system
- Role-based access control
- Activity tracking and audit logs

### 📊 Publishing & Analytics (Coming Soon)
- Scheduled publishing to social platforms
- Performance analytics and tracking
- Campaign performance comparison
- ROI measurement

---

## 🏗 Architecture

### Database Schema

The platform uses Supabase (PostgreSQL) with the following key tables:

```
portfolios
├── campaigns
│   ├── campaign_assets
│   ├── campaign_version_history
│   └── soft_deletes
├── assets
│   ├── asset_versions
│   ├── asset_tags
│   ├── asset_favorites
│   └── campaign_assets
├── folders
├── collections
├── brand_kits
└── templates
```

All tables include Row Level Security (RLS) for user isolation and data protection.

### Tech Stack

```
Frontend:
  ├── React 19 + TypeScript
  ├── Vite 5 (build tool)
  ├── Tailwind CSS 4
  ├── shadcn/ui (components)
  └── Framer Motion (animations)

Backend:
  ├── Supabase (PostgreSQL + Auth + Storage)
  ├── Edge Functions (Deno)
  └── Row Level Security (RLS)

AI Services:
  ├── OpenAI (text generation)
  ├── fal.ai (video generation via Kling AI)
  └── Manus (image generation)

Payments:
  └── Stripe (subscriptions & one-off purchases)

Hosting:
  ├── Vercel (frontend)
  └── Supabase (backend)
```

---

## 📁 Project Structure

```
alter-ai-studio/
├── src/
│   ├── pages/
│   │   ├── Portfolio.tsx              # Main portfolio page with 8 tabs
│   │   ├── CampaignGenerator.tsx      # Campaign generation interface
│   │   └── ...
│   ├── components/
│   │   ├── portfolio/
│   │   │   ├── CampaignsTab.tsx       # Campaign library (card/list view)
│   │   │   ├── AssetsTab.tsx          # Asset library (grid/list view)
│   │   │   ├── CampaignDetails.tsx    # Campaign details & editing
│   │   │   ├── TabPlaceholders.tsx    # Placeholder tabs
│   │   │   └── index.ts
│   │   ├── canvas/
│   │   │   └── Canvas.tsx             # Canva-style drag-and-drop editor
│   │   └── ui/                        # shadcn/ui components
│   ├── lib/
│   │   ├── portfolio/
│   │   │   ├── portfolio-service.ts        # CRUD operations
│   │   │   ├── campaign-integration.ts     # Campaign auto-save & asset creation
│   │   │   ├── platform-converter.ts       # Multi-platform export
│   │   │   ├── platform-formats.ts         # Platform specifications
│   │   │   └── asset-remix-service.ts      # Asset remixing (Phase 4)
│   │   └── ...
│   ├── hooks/
│   │   ├── useAutoSaveCampaign.ts     # Auto-save hook with debounce
│   │   └── ...
│   └── ...
├── supabase/
│   ├── migrations/
│   │   └── 20260722205756_portfolio_system.sql
│   └── ...
├── public/
│   ├── logo.png
│   ├── favicon.ico
│   └── og-image.jpg
└── ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm)
- Supabase account
- Stripe account (for payments)
- OpenAI API key
- fal.ai API key (for video generation)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alternateaibotstation-alt/alter-ai-studio.git
cd alter-ai-studio
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# fal.ai
VITE_FAL_API_KEY=your_fal_api_key

# Stripe
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Manus OAuth
VITE_MANUS_CLIENT_ID=your_manus_client_id
```

4. **Run database migrations**
```bash
pnpm supabase migration up
```

5. **Start development server**
```bash
pnpm dev
```

Visit `http://localhost:5173` to see the app.

---

## 📚 API Documentation

### Portfolio Service

```typescript
import { PortfolioService } from '@/lib/portfolio/portfolio-service';

// Create campaign
const campaign = await PortfolioService.createCampaign(portfolioId, {
  name: 'Summer Campaign',
  description: 'Campaign for summer products',
  input_prompt: 'Create engaging summer marketing content',
  status: 'completed'
});

// Get campaigns with filtering
const campaigns = await PortfolioService.getCampaigns(portfolioId, {
  status: 'completed',
  orderBy: 'created_at',
  orderDirection: 'desc',
  limit: 20,
  offset: 0
});

// Create asset
const asset = await PortfolioService.createAsset(portfolioId, {
  name: 'Summer Banner',
  type: 'image',
  file_url: 'https://...',
  platform: 'instagram',
  status: 'approved'
});

// Link asset to campaign (many-to-many)
await PortfolioService.linkAssetToCampaign(campaignId, assetId, position);

// Manage favorites
await PortfolioService.addToFavorites(assetId);
await PortfolioService.removeFromFavorites(assetId);

// Search assets
const results = await PortfolioService.searchAssets(portfolioId, 'summer');

// Asset versioning
await PortfolioService.createAssetVersion(assetId, newFileUrl, 'Updated colors');
const versions = await PortfolioService.getAssetVersions(assetId);

// Tagging
await PortfolioService.addAssetTag(assetId, 'summer');
const tags = await PortfolioService.getAssetTags(assetId);
```

### Campaign Integration Service

```typescript
import { CampaignIntegrationService } from '@/lib/portfolio/campaign-integration';

// Save generated campaign with all assets
const result = await CampaignIntegrationService.saveCampaign(portfolioId, {
  name: 'Q4 Campaign',
  description: 'Holiday campaign',
  inputPrompt: 'Generate Q4 holiday campaign',
  content: {
    images: ['url1', 'url2'],
    videos: ['video_url'],
    scripts: ['script_content'],
    captions: ['caption_text'],
    documents: ['pdf_url']
  }
});
// Returns: { campaignId, assetIds }

// Auto-save draft campaign
const draftId = await CampaignIntegrationService.saveDraftCampaign(
  portfolioId,
  campaignData
);

// Update draft (for auto-save)
await CampaignIntegrationService.updateDraftCampaign(draftId, updatedData);

// Duplicate campaign with all assets
const newCampaignId = await CampaignIntegrationService.duplicateCampaign(
  portfolioId,
  campaignId
);

// Get campaign with all assets
const data = await CampaignIntegrationService.getCampaignWithAssets(campaignId);
// Returns: { campaign, assets }

// Create platform-specific versions
const versions = await CampaignIntegrationService.createPlatformVersions(
  portfolioId,
  assetId,
  ['instagram_reels', 'tiktok', 'youtube_shorts']
);

// Export campaign
const exported = await CampaignIntegrationService.exportCampaign(campaignId);

// Archive campaign
await CampaignIntegrationService.archiveCampaign(campaignId);
```

### Platform Converter

```typescript
import { PlatformConverter } from '@/lib/portfolio/platform-converter';

// Get platform specifications
const specs = PlatformConverter.getFormatSpecs('instagram_reels');
// Returns: { dimensions, aspectRatio, maxFileSize, supportedFormats, ... }

// Convert asset dimensions to platform specs
const dimensions = PlatformConverter.convertDimensions(
  'tiktok',
  1080,
  1920,
  { maintainAspectRatio: true }
);

// Get export settings for platform
const settings = PlatformConverter.getExportSettings('youtube_shorts', {
  quality: 90,
  format: 'mp4'
});

// Validate asset for platform
const validation = PlatformConverter.validateAssetForPlatform(
  'instagram_story',
  fileSize,
  dimensions
);
// Returns: { valid, errors }

// Get caption length for platform
const maxLength = PlatformConverter.getCaptionLength('twitter');

// Get hashtag limit
const limit = PlatformConverter.getHashtagLimit('instagram');

// Get best practices
const practices = PlatformConverter.getBestPractices('tiktok');

// Generate export filename
const filename = PlatformConverter.generateExportFilename(
  'summer_campaign',
  'instagram_reels',
  'mp4'
);

// Batch convert to multiple platforms
const results = await PlatformConverter.batchConvert(
  assetUrl,
  ['instagram_reels', 'tiktok', 'youtube_shorts'],
  { quality: 85, format: 'mp4' }
);
```

### Auto-Save Hook

```typescript
import { useAutoSaveCampaign } from '@/hooks/useAutoSaveCampaign';

function CampaignEditor() {
  const [campaignData, setCampaignData] = useState({
    name: 'My Campaign',
    inputPrompt: 'Create content',
    description: 'Campaign description'
  });

  // Auto-saves every 3 seconds
  const { campaignId, isSaving, saveNow } = useAutoSaveCampaign(
    campaignData,
    {
      portfolioId: 'portfolio-123',
      campaignId: existingCampaignId, // Optional, for updates
      enabled: true,
      debounceMs: 3000,
      onSave: (id) => console.log('Saved campaign:', id),
      onError: (error) => console.error('Save failed:', error)
    }
  );

  return (
    <div>
      <input
        value={campaignData.name}
        onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
        placeholder="Campaign name"
      />
      <textarea
        value={campaignData.inputPrompt}
        onChange={(e) => setCampaignData({ ...campaignData, inputPrompt: e.target.value })}
        placeholder="Input prompt"
      />
      <button onClick={saveNow} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Now'}
      </button>
    </div>
  );
}
```

---

## 🎨 UI Components

### Canvas Component

The Canvas component provides a Canva-style editor for visual content creation:

```typescript
import Canvas from '@/components/canvas/Canvas';

function Editor() {
  return (
    <Canvas
      width={1080}
      height={1920}
      initialElements={[]}
      onSave={(elements) => {
        console.log('Canvas saved:', elements);
        // Save to database
      }}
    />
  );
}
```

**Features:**
- Drag-and-drop elements
- Text, shapes, and image support
- Zoom controls (50-200%)
- Undo/redo history
- Properties panel (opacity, rotation, z-index)
- Element selection and deletion
- Duplicate functionality

### Portfolio Page

The main portfolio page with 8 tabs:

1. **Campaigns** — View and manage campaigns (card/list view)
2. **Assets** — Browse and organize assets (grid/list view)
3. **Templates** — Saved campaign templates
4. **Brand Kits** — Brand guidelines and colors
5. **Collections** — Custom asset collections
6. **Favorites** — Quick access to favorites
7. **Recently Edited** — Recent changes
8. **Trash** — Deleted items (30-day retention)

**Features:**
- Search across all items
- Toggle between grid and list view
- Bulk actions (select, delete, archive, favorite)
- Sorting and filtering
- Responsive design

---

## 🔄 Workflow Examples

### Example 1: Generate and Save Campaign

```typescript
// 1. Generate content using AI
const generatedContent = await generateCampaignWithAI({
  prompt: 'Create summer campaign',
  platforms: ['instagram', 'tiktok']
});

// 2. Save campaign with all assets
const { campaignId, assetIds } = await CampaignIntegrationService.saveCampaign(
  portfolioId,
  {
    name: 'Summer Campaign',
    description: 'Multi-platform summer content',
    inputPrompt: 'Create summer campaign',
    content: generatedContent
  }
);

// 3. Create platform-specific versions
const versions = await CampaignIntegrationService.createPlatformVersions(
  portfolioId,
  assetIds[0],
  ['instagram_reels', 'tiktok', 'youtube_shorts']
);

// 4. Campaign is now in portfolio, ready to share
```

### Example 2: Remix Assets from Multiple Campaigns

```typescript
// 1. Get assets from different campaigns
const campaign1Assets = await PortfolioService.getCampaignAssets(campaign1Id);
const campaign2Assets = await PortfolioService.getCampaignAssets(campaign2Id);

// 2. Create new campaign with mixed assets
const newCampaign = await PortfolioService.createCampaign(portfolioId, {
  name: 'Mixed Campaign',
  description: 'Remixed from campaigns 1 and 2'
});

// 3. Link assets from both campaigns
for (const asset of [...campaign1Assets, ...campaign2Assets]) {
  await PortfolioService.linkAssetToCampaign(newCampaign.id, asset.id);
}

// 4. New campaign now contains reused assets
```

### Example 3: Auto-Save Draft Campaign

```typescript
function CampaignEditor() {
  const [campaignData, setCampaignData] = useState({
    name: 'New Campaign',
    inputPrompt: 'Draft content'
  });

  // Auto-saves every 3 seconds
  const { campaignId } = useAutoSaveCampaign(campaignData, {
    portfolioId: userPortfolioId,
    enabled: true,
    debounceMs: 3000
  });

  return (
    <div>
      <input
        value={campaignData.name}
        onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
      />
      {/* Content editor */}
      <p>Draft ID: {campaignId}</p>
    </div>
  );
}
```

---

## 🔐 Security & Permissions

- **Row Level Security (RLS)** — All tables have RLS policies
- **User Isolation** — Users can only access their own portfolios and campaigns
- **Role-Based Access** — Support for admin and user roles
- **API Authentication** — All API calls require authentication
- **Data Encryption** — Sensitive data encrypted at rest

---

## 📊 Database Optimization

- Indexed columns for fast search and filtering
- Composite indexes for common query patterns
- Efficient pagination with limit/offset
- Full-text search support on campaign names and descriptions
- Optimized foreign key relationships

---

## 🚀 Deployment

### Vercel Deployment

```bash
# Build for production
pnpm build

# Deploy to Vercel
vercel deploy
```

### Docker Deployment

```bash
docker build -t alterai .
docker run -p 3000:3000 alterai
```

---

## 📝 Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and test**
   ```bash
   pnpm dev
   pnpm test
   ```

3. **Commit and push**
   ```bash
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

4. **Create pull request**
   - Describe changes
   - Link related issues
   - Request review

5. **Merge to main**
   ```bash
   git merge feature/new-feature
   git push origin main
   ```

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase URL and API key
- Check network connectivity
- Ensure database migrations are up to date

### Asset Upload Failures
- Check file size limits (varies by platform)
- Verify file format is supported
- Check storage quota

### Auto-Save Not Working
- Verify portfolio ID is set
- Check browser console for errors
- Ensure network connectivity

---

## 📞 Support

For issues and questions:
- **GitHub Issues:** https://github.com/alternateaibotstation-alt/alter-ai-studio/issues
- **Email:** support@alterai.im

---

## 📄 License & Ownership

**Alterai.im is proprietary software, solely owned and operated by Carley Lenon.**

© 2024–2026 Carley Lenon. All rights reserved. No part of this repository — including code, design, brand assets, prompts, or documentation — may be copied, modified, redistributed, sublicensed, sold, or used to train derivative models or competing products without prior written permission from the owner.

This repository is published for transparency and continuous deployment only. It is **not** open source.

---

## 📬 Contact

- **Owner:** Carley Lenon
- **Email:** [alternateaibotstation@gmail.com](mailto:alternateaibotstation@gmail.com)
- **Site:** [https://alterai.im](https://alterai.im)

For business inquiries, partnerships, DMCA notices, or support requests, email the address above. Response time: 1–2 business days.

---

**Alterai.im** — Where AI meets creativity. Generate, organize, and distribute marketing content at scale.
