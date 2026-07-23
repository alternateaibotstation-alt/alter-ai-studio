import { useEffect, useState } from 'react';
import { PortfolioService, Campaign } from '@/lib/portfolio/portfolio-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
  Calendar,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CampaignsTabProps {
  portfolioId: string | null;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  loading: boolean;
}

export default function CampaignsTab({
  portfolioId,
  viewMode,
  searchQuery,
  loading,
}: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);

  // Load campaigns
  useEffect(() => {
    if (!portfolioId) return;

    const loadCampaigns = async () => {
      setIsLoading(true);
      try {
        const data = await PortfolioService.getCampaigns(portfolioId, {
          orderBy: 'created_at',
          orderDirection: 'desc',
        });
        setCampaigns(data);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        toast.error('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [portfolioId]);

  // Filter campaigns based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCampaigns(campaigns);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = campaigns.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(query) ||
        campaign.description?.toLowerCase().includes(query)
    );
    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery]);

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      if (!portfolioId) return;

      const newCampaign = await PortfolioService.createCampaign(portfolioId, {
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        input_prompt: campaign.input_prompt,
        strategy: campaign.strategy,
        notes: campaign.notes,
      });

      if (newCampaign) {
        setCampaigns([newCampaign, ...campaigns]);
        toast.success('Campaign duplicated successfully');
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast.error('Failed to duplicate campaign');
    }
  };

  const handleArchive = async (campaign: Campaign) => {
    try {
      const success = await PortfolioService.archiveCampaign(campaign.id);
      if (success) {
        setCampaigns(campaigns.filter((c) => c.id !== campaign.id));
        toast.success('Campaign archived');
      }
    } catch (error) {
      console.error('Error archiving campaign:', error);
      toast.error('Failed to archive campaign');
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;

    try {
      const success = await PortfolioService.deleteCampaign(selectedCampaign.id);
      if (success) {
        setCampaigns(campaigns.filter((c) => c.id !== selectedCampaign.id));
        setDeleteDialogOpen(false);
        setSelectedCampaign(null);
        toast.success('Campaign deleted');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-48 bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredCampaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Zap className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No campaigns yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm">
          {searchQuery
            ? 'No campaigns match your search. Try a different query.'
            : 'Create your first campaign to get started.'}
        </p>
        {!searchQuery && (
          <Button className="mt-4 gap-2">
            <Zap className="w-4 h-4" />
            Create Campaign
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative overflow-hidden">
                <Zap className="w-12 h-12 text-slate-400 dark:text-slate-600" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate flex-1">
                    {campaign.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleDuplicate(campaign)}
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleArchive(campaign)}
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-red-600 dark:text-red-400"
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {campaign.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {campaign.name}
                  </h3>
                  {campaign.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {campaign.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleDuplicate(campaign)}
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleArchive(campaign)}
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-red-600 dark:text-red-400"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
