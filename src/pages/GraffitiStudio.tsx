import { useState } from "react";
import { useGraffitiCanvas } from "@/hooks/use-graffiti-canvas";
import GraffitiToolPanel from "@/components/graffiti/GraffitiToolPanel";
import GraffitiAIPanel from "@/components/graffiti/GraffitiAIPanel";
import GraffitiCanvas from "@/components/graffiti/GraffitiCanvas";
import GraffitiBottomBar from "@/components/graffiti/GraffitiBottomBar";
import GraffitiGalleryTab from "@/components/graffiti/GraffitiGalleryTab";
import Navbar from "@/components/Navbar";
import PaywallModal from "@/components/PaywallModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Paintbrush, Wand2, Images } from "lucide-react";
import { toast } from "sonner";

const FREE_REMIX_LIMIT = 1;

export default function GraffitiStudio() {
  const {
    canvasRef,
    brush, setBrush,
    color, setColor,
    size, setSize,
    draw, startDrawing, stopDrawing,
    undo, redo, clear,
    getCanvasDataUrl, loadImageToCanvas,
    initCanvas,
    canUndo, canRedo,
  } = useGraffitiCanvas();

  const { tier } = useSubscription();
  const isFree = tier === "free";
  const isMobile = useIsMobile();
  const [remixesUsed, setRemixesUsed] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"studio" | "gallery">("studio");

  const remixesLeft = isFree ? Math.max(0, FREE_REMIX_LIMIT - remixesUsed) : Infinity;

  const toolPanelProps = {
    brush, setBrush, color, setColor, size, setSize,
    isFree, onPaywall: () => setPaywallOpen(true),
  };

  const aiPanelProps = {
    getCanvasDataUrl, loadImageToCanvas,
    onError: (msg: string) => toast.error(msg),
    onSuccess: (msg: string) => toast.success(msg),
    isFree, remixesLeft,
    onPaywall: () => setPaywallOpen(true),
    onRemixUsed: () => setRemixesUsed((p) => p + 1),
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />

      {/* Tab switcher */}
      <div className="pt-16 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex gap-0 px-4">
          <button
            onClick={() => setActiveTab("studio")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "studio"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Paintbrush className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Studio
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "gallery"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Images className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Gallery
          </button>
        </div>
      </div>

      {activeTab === "gallery" ? (
        <div className="flex-1 overflow-y-auto">
          <GraffitiGalleryTab onSwitchToStudio={() => setActiveTab("studio")} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop: side panels */}
          {!isMobile && (
            <GraffitiToolPanel {...toolPanelProps} />
          )}

          <div className="flex flex-col flex-1 overflow-hidden relative">
            {/* Mobile: floating toggle buttons */}
            {isMobile && (
              <div className="absolute top-2 left-2 right-2 z-20 flex justify-between pointer-events-none">
                <Sheet open={toolsOpen} onOpenChange={setToolsOpen}>
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="pointer-events-auto shadow-lg gap-1.5"
                    >
                      <Paintbrush className="w-4 h-4" />
                      Tools
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0 overflow-y-auto">
                    <div className="pt-10">
                      <GraffitiToolPanel {...toolPanelProps} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={aiOpen} onOpenChange={setAiOpen}>
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="pointer-events-auto shadow-lg gap-1.5"
                    >
                      <Wand2 className="w-4 h-4" />
                      AI
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 p-0 overflow-y-auto">
                    <div className="pt-10">
                      <GraffitiAIPanel {...aiPanelProps} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            <GraffitiCanvas
              canvasRef={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              initCanvas={initCanvas}
            />

            <GraffitiBottomBar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onClear={clear}
              getCanvasDataUrl={getCanvasDataUrl}
              addWatermark={isFree}
            />
          </div>

          {!isMobile && (
            <GraffitiAIPanel {...aiPanelProps} />
          )}
        </div>
      )}

      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason="images" />
    </div>
  );
}
