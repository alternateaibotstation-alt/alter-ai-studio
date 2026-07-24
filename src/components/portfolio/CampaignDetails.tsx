import { useEffect, useState } from 'react';
import { CampaignIntegrationService } from '@/lib/portfolio/campaign-integration';
import { PortfolioService, Campaign, Asset } from '@/lib/portfolio/portfolio-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Download,
  Share2,
  Edit2,
  Archive,
  Trash2,
  Copy,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CampaignDetailsProps {
  campaignId: string;
  onClose?: () => void;
  onUpdate?: (campaign: Campaign) => void;
}

export default function CampaignDetails({
  campaignId,
  onClose,
  onUpdate,
}: CampaignDetailsProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Campaign>>({});
  const [loading, setLoading] = useState(true);

  // Load campaign and assets
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        const data = await CampaignIntegrationService.getCampaignWithAssets(campaignId);
        if (data) {
          setCampaign(data.campaign);
          setAssets(data.assets);
          setEditData(data.campaign);
        }
      } catch (error) {
        console.error('Error loading campaign:', error);
        toast.error('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId]);

  const handleSaveEdits = async () => {
    if (!campaign) return;

    try {
      const updated = await PortfolioService.updateCampaign(campaign.id, editData);
      if (updated) {
        setCampaign(updated);
        setIsEditing(false);
        onUpdate?.(updated);
        toast.success('Campaign updated');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  const handleDuplicate = async () => {
    if (!campaign) return;

    try {
      const newCampaignId = await CampaignIntegrationService.duplicateCampaign(
        campaign.portfolio_id,
        campaign.id
      );
      if (newCampaignId) {
        toast.success('Campaign duplicated');
        onClose?.();
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast.error('Failed to duplicate campaign');
    }
  };

  const handleArchive = async () => {
    if (!campaign) return;

    try {
      const success = await CampaignIntegrationService.archiveCampaign(campaign.id);
      if (success) {
        toast.success('Campaign archived');
        onClose?.();
      }
    } catch (error) {
      console.error('Error archiving campaign:', error);
      toast.error('Failed to archive campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Campaign not found
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-2xl font-bold"
                placeholder="Campaign name"
              />
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Campaign description"
                rows={3}
              />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {campaign.name}
              </h1>
              {campaign.description && (
                <p className="text-slate-600 dark:text-slate-400 mt-2">{campaign.description}</p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSaveEdits} className="gap-2">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditData(campaign);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Status</div>
          <Badge className="mt-2">{campaign.status}</Badge>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Created</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
            {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Updated</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
            {formatDistanceToNow(new Date(campaign.updated_at), { addSuffix: true })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">Assets</div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
            {assets.length} items
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Assets</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-6">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No assets in this campaign</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    {asset.type === 'image' && <ImageIcon className="w-8 h-8 text-slate-400" />}
                    {asset.type === 'video' && <Video className="w-8 h-8 text-slate-400" />}
                    {asset.type === 'caption' && <MessageSquare className="w-8 h-8 text-slate-400" />}
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {asset.name}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {asset.type}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6 space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Campaign Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400">Input Prompt</label>
                <p className="text-slate-900 dark:text-white mt-1">{campaign.input_prompt}</p>
              </div>
              {campaign.strategy && (
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Strategy</label>
                  <p className="text-slate-900 dark:text-white mt-1">{campaign.strategy}</p>
                </div>
              )}
              {campaign.notes && (
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Notes</label>
                  <p className="text-slate-900 dark:text-white mt-1">{campaign.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Campaign created
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(campaign.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Last updated
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(campaign.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            onClick={handleArchive}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
