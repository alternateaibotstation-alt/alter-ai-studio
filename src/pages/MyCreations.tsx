import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useCreations, Creation } from "@/hooks/use-creations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Film, Image, Loader2, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyCreations() {
  const { creations, loading, userId, deleteCreation } = useCreations();
  const [filter, setFilter] = useState<"all" | "video" | "image">("all");

  const filtered = filter === "all" ? creations : creations.filter((c) => c.type === filter);

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center space-y-4">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">My Creations</h1>
          <p className="text-muted-foreground">Sign in to view your saved creations.</p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-12 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Creations</h1>
            <p className="text-sm text-muted-foreground">
              {creations.length} saved creation{creations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {(["all", "video", "image"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === "video" && <Film className="w-3 h-3 mr-1" />}
                {f === "image" && <Image className="w-3 h-3 mr-1" />}
                {f}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {filter === "all" ? "No creations yet. Generate content to get started!" : `No ${filter}s found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((creation) => (
              <CreationCard key={creation.id} creation={creation} onDelete={deleteCreation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreationCard({ creation, onDelete }: { creation: Creation; onDelete: (c: Creation) => void }) {
  const isVideo = creation.type === "video";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = creation.file_url;
    a.download = `${creation.title}.${isVideo ? "webm" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <Card className="border-border/50 overflow-hidden group">
      <div className="aspect-[9/16] max-h-[300px] bg-secondary/30 relative overflow-hidden">
        {isVideo ? (
          <video
            src={creation.file_url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
          />
        ) : (
          <img src={creation.file_url} alt={creation.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            {isVideo ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
            {creation.type}
          </span>
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground truncate">{creation.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(creation.created_at), "MMM d, yyyy · h:mm a")}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1" onClick={handleDownload}>
            <Download className="w-3 h-3" /> Download
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete creation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{creation.title}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(creation)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
