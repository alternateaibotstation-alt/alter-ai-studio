import { Button } from '@/components/ui/button';
import { FileText, Palette, Layers, Heart, Clock, Trash2 } from 'lucide-react';

interface TabPlaceholderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
}

function TabPlaceholder({ icon, title, description, actionLabel }: TabPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-slate-300 dark:text-slate-700 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm">{description}</p>
      {actionLabel && <Button className="mt-4">{actionLabel}</Button>}
    </div>
  );
}

export function TemplatesTab({ portfolioId }: { portfolioId: string | null; viewMode: string }) {
  return (
    <TabPlaceholder
      icon={<FileText className="w-12 h-12" />}
      title="No templates yet"
      description="Create reusable templates from your campaigns to speed up future projects."
      actionLabel="Create Template"
    />
  );
}

export function BrandKitsTab({ portfolioId }: { portfolioId: string | null; viewMode: string }) {
  return (
    <TabPlaceholder
      icon={<Palette className="w-12 h-12" />}
      title="No brand kits yet"
      description="Set up brand kits with your colors, fonts, and logos for consistent branding."
      actionLabel="Create Brand Kit"
    />
  );
}

export function CollectionsTab({ portfolioId }: { portfolioId: string | null; viewMode: string }) {
  return (
    <TabPlaceholder
      icon={<Layers className="w-12 h-12" />}
      title="No collections yet"
      description="Organize your assets into collections for better project management."
      actionLabel="Create Collection"
    />
  );
}

export function FavoritesTab({ portfolioId }: { portfolioId: string | null; viewMode: string }) {
  return (
    <TabPlaceholder
      icon={<Heart className="w-12 h-12" />}
      title="No favorites yet"
      description="Mark your favorite assets and campaigns for quick access."
    />
  );
}

export function RecentlyEditedTab({
  portfolioId,
}: {
  portfolioId: string | null;
  viewMode: string;
}) {
  return (
    <TabPlaceholder
      icon={<Clock className="w-12 h-12" />}
      title="No recent items"
      description="Your recently edited campaigns and assets will appear here."
    />
  );
}

export function TrashTab({ portfolioId }: { portfolioId: string | null; viewMode: string }) {
  return (
    <TabPlaceholder
      icon={<Trash2 className="w-12 h-12" />}
      title="Trash is empty"
      description="Deleted campaigns and assets will appear here for 30 days before permanent deletion."
    />
  );
}
