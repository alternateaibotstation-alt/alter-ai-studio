import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Settings,
  Clock,
  Heart,
  Trash2,
  Zap,
  FileText,
  Palette,
  Layers,
} from 'lucide-react';
import { PortfolioService, Campaign, Asset } from '@/lib/portfolio/portfolio-service';
import {
  CampaignsTab,
  AssetsTab,
  TemplatesTab,
  BrandKitsTab,
  CollectionsTab,
  FavoritesTab,
  RecentlyEditedTab,
  TrashTab,
} from '@/components/portfolio';

export default function Portfolio() {
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  // Load portfolio ID from user's first portfolio
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        // In a real app, this would fetch the user's default portfolio
        // For now, we'll use a placeholder
        setPortfolioId('default-portfolio-id');
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    };

    loadPortfolio();
  }, []);

  // Load campaigns when portfolio changes
  useEffect(() => {
    if (!portfolioId) return;

    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const data = await PortfolioService.getCampaigns(portfolioId, {
          status: 'completed',
          orderBy: 'created_at',
          orderDirection: 'desc',
        });
        setCampaigns(data);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'campaigns') {
      loadCampaigns();
    }
  }, [portfolioId, activeTab]);

  // Load assets when portfolio changes
  useEffect(() => {
    if (!portfolioId) return;

    const loadAssets = async () => {
      setLoading(true);
      try {
        const data = await PortfolioService.getAssets(portfolioId, {
          orderBy: 'created_at',
          orderDirection: 'desc',
        });
        setAssets(data);
      } catch (error) {
        console.error('Error loading assets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'assets') {
      loadAssets();
    }
  }, [portfolioId, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Portfolio</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Manage your campaigns, assets, and creative projects
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </Button>
          </div>

          {/* Search and View Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search campaigns, assets, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
            <TabsTrigger value="campaigns" className="gap-2 text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2 text-xs sm:text-sm">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="brand-kits" className="gap-2 text-xs sm:text-sm">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="collections" className="gap-2 text-xs sm:text-sm">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Collections</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2 text-xs sm:text-sm">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Recent</span>
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2 text-xs sm:text-sm">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Trash</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab
              portfolioId={portfolioId}
              viewMode={viewMode}
              searchQuery={searchQuery}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <AssetsTab
              portfolioId={portfolioId}
              viewMode={viewMode}
              searchQuery={searchQuery}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplatesTab portfolioId={portfolioId} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="brand-kits" className="mt-6">
            <BrandKitsTab portfolioId={portfolioId} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            <CollectionsTab portfolioId={portfolioId} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <FavoritesTab portfolioId={portfolioId} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <RecentlyEditedTab portfolioId={portfolioId} viewMode={viewMode} />
          </TabsContent>

          <TabsContent value="trash" className="mt-6">
            <TrashTab portfolioId={portfolioId} viewMode={viewMode} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
