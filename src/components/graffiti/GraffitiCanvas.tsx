import { useEffect } from "react";

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  initCanvas: () => void;
}

export default function GraffitiCanvas({
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  initCanvas,
}: Props) {
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  return (
    <div className="flex-1 relative overflow-hidden bg-[#1a1a2e]">
      {/* Brick texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 30px,
              rgba(255,255,255,0.15) 30px,
              rgba(255,255,255,0.15) 31px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.1) 60px,
              rgba(255,255,255,0.1) 61px
            )
          `,
          backgroundSize: "61px 31px",
        }}
      />
      {/* Offset bricks */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 30px,
              rgba(255,255,255,0.12) 30px,
              rgba(255,255,255,0.12) 31px
            )
          `,
          backgroundSize: "61px 31px",
          backgroundPosition: "30px 15.5px",
        }}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
    </div>
  );
}
