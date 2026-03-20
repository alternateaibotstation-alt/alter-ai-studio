import { useState } from "react";
import { useGraffitiCanvas } from "@/hooks/use-graffiti-canvas";
import GraffitiToolPanel from "@/components/graffiti/GraffitiToolPanel";
import GraffitiAIPanel from "@/components/graffiti/GraffitiAIPanel";
import GraffitiCanvas from "@/components/graffiti/GraffitiCanvas";
import GraffitiBottomBar from "@/components/graffiti/GraffitiBottomBar";
import Navbar from "@/components/Navbar";
import PaywallModal from "@/components/PaywallModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
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
  const [remixesUsed, setRemixesUsed] = useState(0);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const remixesLeft = isFree ? Math.max(0, FREE_REMIX_LIMIT - remixesUsed) : Infinity;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />

      <div className="flex flex-1 pt-16 overflow-hidden">
        <GraffitiToolPanel
          brush={brush}
          setBrush={setBrush}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          isFree={isFree}
          onPaywall={() => setPaywallOpen(true)}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
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

        <GraffitiAIPanel
          getCanvasDataUrl={getCanvasDataUrl}
          loadImageToCanvas={loadImageToCanvas}
          onError={(msg) => toast.error(msg)}
          onSuccess={(msg) => toast.success(msg)}
          isFree={isFree}
          remixesLeft={remixesLeft}
          onPaywall={() => setPaywallOpen(true)}
          onRemixUsed={() => setRemixesUsed((p) => p + 1)}
        />
      </div>

      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason="images" />
    </div>
  );
}
