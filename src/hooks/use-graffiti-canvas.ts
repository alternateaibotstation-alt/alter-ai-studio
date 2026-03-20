import { useRef, useState, useCallback, useEffect } from "react";

export type BrushType = "spray" | "marker" | "neon" | "drip";

interface CanvasState {
  imageData: ImageData;
}

export function useGraffitiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brush, setBrush] = useState<BrushType>("spray");
  const [color, setColor] = useState("#FF1493");
  const [size, setSize] = useState(20);
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext("2d") ?? null;
  }, []);

  const saveState = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ imageData });
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [getCtx, historyIndex]);

  const drawSpray = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const density = size * 2;
    ctx.fillStyle = color;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size;
      const dx = x + Math.cos(angle) * radius;
      const dy = y + Math.sin(angle) * radius;
      ctx.globalAlpha = Math.random() * 0.3 + 0.1;
      ctx.beginPath();
      ctx.arc(dx, dy, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [color, size]);

  const drawMarker = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, lx: number, ly: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [color, size]);

  const drawNeon = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, lx: number, ly: number) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 2;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = size * 0.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    // Outer glow
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.8;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }, [color, size]);

  const drawDrip = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    // Main blob
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    // Random drips going down
    const dripCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < dripCount; i++) {
      const dripX = x + (Math.random() - 0.5) * size;
      const dripLen = Math.random() * size * 3 + size;
      const dripWidth = Math.random() * 3 + 1.5;
      ctx.beginPath();
      ctx.ellipse(dripX, y + dripLen / 2, dripWidth, dripLen / 2, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.5;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [color, size]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const lx = lastPos.current?.x ?? x;
    const ly = lastPos.current?.y ?? y;

    switch (brush) {
      case "spray":
        drawSpray(ctx, x, y);
        break;
      case "marker":
        drawMarker(ctx, x, y, lx, ly);
        break;
      case "neon":
        drawNeon(ctx, x, y, lx, ly);
        break;
      case "drip":
        drawDrip(ctx, x, y);
        break;
    }

    lastPos.current = { x, y };
  }, [isDrawing, brush, getCtx, drawSpray, drawMarker, drawNeon, drawDrip]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    lastPos.current = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      saveState();
    }
  }, [isDrawing, saveState]);

  const undo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex].imageData, 0, 0);
    setHistoryIndex(newIndex);
  }, [getCtx, history, historyIndex]);

  const redo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex].imageData, 0, 0);
    setHistoryIndex(newIndex);
  }, [getCtx, history, historyIndex]);

  const clear = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [getCtx, saveState]);

  const getCanvasDataUrl = useCallback(() => {
    return canvasRef.current?.toDataURL("image/png") ?? null;
  }, []);

  const loadImageToCanvas = useCallback((dataUrl: string) => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveState();
    };
    img.src = dataUrl;
  }, [getCtx, saveState]);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    canvas.width = 1200;
    canvas.height = 800;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [getCtx, saveState]);

  return {
    canvasRef,
    brush,
    setBrush,
    color,
    setColor,
    size,
    setSize,
    draw,
    startDrawing,
    stopDrawing,
    undo,
    redo,
    clear,
    getCanvasDataUrl,
    loadImageToCanvas,
    initCanvas,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
