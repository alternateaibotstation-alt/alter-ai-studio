import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Download,
  Copy,
  Trash2,
  Plus,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
} from 'lucide-react';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  content?: string;
  src?: string;
  shapeType?: 'rectangle' | 'circle' | 'line';
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  locked?: boolean;
  hidden?: boolean;
}

interface CanvasProps {
  width?: number;
  height?: number;
  onSave?: (elements: CanvasElement[]) => void;
  initialElements?: CanvasElement[];
}

export default function Canvas({
  width = 1080,
  height = 1920,
  onSave,
  initialElements = [],
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<CanvasElement[][]>([initialElements]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedElement = elements.find((el) => el.id === selectedId);

  // Add to history
  const addToHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newElements]);
    setHistoryIndex((prev) => prev + 1);
    setElements(newElements);
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  // Add text element
  const addTextElement = () => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 50,
      y: 50,
      width: 300,
      height: 100,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length,
      content: 'Double click to edit',
      fontSize: 24,
      fontFamily: 'Arial',
      textColor: '#000000',
    };
    addToHistory([...elements, newElement]);
  };

  // Add shape element
  const addShapeElement = (shapeType: 'rectangle' | 'circle' | 'line') => {
    const newElement: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length,
      shapeType,
      fill: '#3b82f6',
      stroke: '#1e40af',
    };
    addToHistory([...elements, newElement]);
  };

  // Delete element
  const handleDelete = () => {
    if (!selectedId) return;
    addToHistory(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  // Duplicate element
  const handleDuplicate = () => {
    if (!selectedElement) return;
    const newElement: CanvasElement = {
      ...selectedElement,
      id: `${selectedElement.id}-copy-${Date.now()}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };
    addToHistory([...elements, newElement]);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const updated = elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    addToHistory(updated);
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  };

  // Handle element drag
  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedId(elementId);
    setIsDragging(true);
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      setDragOffset({
        x: e.clientX - element.x,
        y: e.clientY - element.y,
      });
    }
  };

  // Handle drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;

    const element = elements.find((el) => el.id === selectedId);
    if (element) {
      updateElement(selectedId, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="gap-2"
          >
            ↶ Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="gap-2"
          >
            ↷ Redo
          </Button>
        </div>

        <div className="border-l border-slate-700 h-6" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={addTextElement}
            className="gap-2"
          >
            <Type className="w-4 h-4" />
            Text
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addShapeElement('rectangle')}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Rectangle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addShapeElement('circle')}
            className="gap-2"
          >
            <Circle className="w-4 h-4" />
            Circle
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Image
          </Button>
        </div>

        <div className="border-l border-slate-700 h-6" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="gap-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-300 w-12 text-center">{zoom}%</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="gap-2"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetZoom}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="border-l border-slate-700 h-6 ml-auto" />

        {selectedElement && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDuplicate}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              className="gap-2 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Button
          size="sm"
          onClick={() => onSave?.(elements)}
          className="gap-2 ml-2"
        >
          <Save className="w-4 h-4" />
          Save
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-slate-950 p-8 flex items-center justify-center">
        <div
          ref={canvasRef}
          className="relative bg-white shadow-2xl cursor-default"
          style={{
            width: `${(width * zoom) / 100}px`,
            height: `${(height * zoom) / 100}px`,
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas Elements */}
          {elements.map((element) => (
            <div
              key={element.id}
              className={`absolute cursor-move border-2 transition-colors ${
                selectedId === element.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-transparent hover:border-slate-300'
              }`}
              style={{
                left: `${(element.x * zoom) / 100}px`,
                top: `${(element.y * zoom) / 100}px`,
                width: `${(element.width * zoom) / 100}px`,
                height: `${(element.height * zoom) / 100}px`,
                transform: `rotate(${element.rotation}deg)`,
                opacity: element.opacity,
                zIndex: element.zIndex,
                display: element.hidden ? 'none' : 'block',
              }}
              onMouseDown={(e) => handleElementMouseDown(e, element.id)}
            >
              {element.type === 'text' && (
                <div
                  className="w-full h-full flex items-center justify-center p-2 text-center overflow-hidden"
                  style={{
                    fontSize: `${(element.fontSize || 24) * (zoom / 100)}px`,
                    fontFamily: element.fontFamily,
                    color: element.textColor,
                  }}
                >
                  {element.content}
                </div>
              )}

              {element.type === 'shape' && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: element.fill,
                    border: `2px solid ${element.stroke}`,
                    borderRadius: element.shapeType === 'circle' ? '50%' : '0',
                  }}
                />
              )}

              {element.type === 'image' && element.src && (
                <img
                  src={element.src}
                  alt="Canvas element"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedElement && (
        <Card className="absolute bottom-4 right-4 w-64 p-4 bg-slate-800 border-slate-700">
          <h3 className="font-semibold text-white mb-4">Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedElement.opacity}
                onChange={(e) =>
                  updateElement(selectedId!, { opacity: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedElement.rotation}
                onChange={(e) =>
                  updateElement(selectedId!, { rotation: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Z-Index</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateElement(selectedId!, {
                      zIndex: Math.max(0, selectedElement.zIndex - 1),
                    })
                  }
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateElement(selectedId!, {
                      zIndex: selectedElement.zIndex + 1,
                    })
                  }
                >
                  Front
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
