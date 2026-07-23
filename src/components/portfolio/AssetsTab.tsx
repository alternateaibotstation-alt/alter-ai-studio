import { useEffect, useState } from 'react';
import { PortfolioService, Asset } from '@/lib/portfolio/portfolio-service';
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
  Download,
  Heart,
  Trash2,
  Eye,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface AssetsTabProps {
  portfolioId: string | null;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  loading: boolean;
}

export default function AssetsTab({
  portfolioId,
  viewMode,
  searchQuery,
  loading,
}: AssetsTabProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(loading);

  // Load assets
  useEffect(() => {
    if (!portfolioId) return;

    const loadAssets = async () => {
      setIsLoading(true);
      try {
        const data = await PortfolioService.getAssets(portfolioId, {
          orderBy: 'created_at',
          orderDirection: 'desc',
        });
        setAssets(data);
      } catch (error) {
        console.error('Error loading assets:', error);
        toast.error('Failed to load assets');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, [portfolioId]);

  // Filter assets based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAssets(assets);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.type.toLowerCase().includes(query)
    );
    setFilteredAssets(filtered);
  }, [assets, searchQuery]);

  const handleToggleFavorite = async (asset: Asset) => {
    try {
      const isFavorite = favorites.has(asset.id);

      if (isFavorite) {
        await PortfolioService.removeFromFavorites(asset.id);
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(asset.id);
          return newSet;
        });
        toast.success('Removed from favorites');
      } else {
        await PortfolioService.addToFavorites(asset.id);
        setFavorites((prev) => new Set(prev).add(asset.id));
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;

    try {
      const success = await PortfolioService.deleteAsset(selectedAsset.id);
      if (success) {
        setAssets(assets.filter((a) => a.id !== selectedAsset.id));
        setDeleteDialogOpen(false);
        setSelectedAsset(null);
        toast.success('Asset deleted');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'script':
        return '📝';
      case 'caption':
        return '💬';
      case 'audio':
        return '🎵';
      case 'pdf':
        return '📄';
      default:
        return '📦';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="h-40 bg-slate-200 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No assets yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm">
          {searchQuery
            ? 'No assets match your search. Try a different query.'
            : 'Generate campaigns to create assets.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">{getAssetIcon(asset.type)}</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate flex-1">
                    {asset.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Eye className="w-3 h-3" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Edit className="w-3 h-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Download className="w-3 h-3" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-xs"
                        onClick={() => handleToggleFavorite(asset)}
                      >
                        <Heart
                          className={`w-3 h-3 ${
                            favorites.has(asset.id) ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                        {favorites.has(asset.id) ? 'Unfavorite' : 'Favorite'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-xs text-red-600 dark:text-red-400"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {asset.type}
                    </Badge>
                    {asset.platform && (
                      <Badge variant="outline" className="text-xs">
                        {asset.platform}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl">{getAssetIcon(asset.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {asset.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {asset.type}
                      </Badge>
                      {asset.platform && (
                        <Badge variant="outline" className="text-xs">
                          {asset.platform}
                        </Badge>
                      )}
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                      </span>
                    </div>
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
                    <DropdownMenuItem className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleToggleFavorite(asset)}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.has(asset.id) ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                      {favorites.has(asset.id) ? 'Unfavorite' : 'Favorite'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-red-600 dark:text-red-400"
                      onClick={() => {
                        setSelectedAsset(asset);
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
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedAsset?.name}"? This action cannot be undone.
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
