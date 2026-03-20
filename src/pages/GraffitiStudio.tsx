import { useGraffitiCanvas } from "@/hooks/use-graffiti-canvas";
import GraffitiToolPanel from "@/components/graffiti/GraffitiToolPanel";
import GraffitiAIPanel from "@/components/graffiti/GraffitiAIPanel";
import GraffitiCanvas from "@/components/graffiti/GraffitiCanvas";
import GraffitiBottomBar from "@/components/graffiti/GraffitiBottomBar";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />

      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Left: Tools */}
        <GraffitiToolPanel
          brush={brush}
          setBrush={setBrush}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
        />

        {/* Center: Canvas */}
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

          {/* Bottom bar */}
          <GraffitiBottomBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onClear={clear}
            getCanvasDataUrl={getCanvasDataUrl}
          />
        </div>

        {/* Right: AI Panel */}
        <GraffitiAIPanel
          getCanvasDataUrl={getCanvasDataUrl}
          loadImageToCanvas={loadImageToCanvas}
          onError={(msg) => toast.error(msg)}
          onSuccess={(msg) => toast.success(msg)}
        />
      </div>
    </div>
  );
}
