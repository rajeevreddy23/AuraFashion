import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Palette, Sparkles, Download, Trash2, Undo, Shirt, Eraser, PenTool } from 'lucide-react';
import { processSketch } from '../services/geminiService';

const DRESS_TEMPLATES = [
  { id: 't1', name: 'Shirt', icon: Shirt, path: 'M150,100 L450,100 L450,200 L500,200 L500,400 L400,400 L400,550 L200,550 L200,400 L100,400 L100,200 L150,200 Z' },
  { id: 't2', name: 'Saree', icon: Shirt, path: 'M100,100 L500,100 L500,500 L100,500 Z' },
  { id: 't3', name: 'Lehanga', icon: Shirt, path: 'M300,100 L100,500 L500,500 Z' },
];

export default function SketchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [selectedTemplate, setSelectedTemplate] = useState(DRESS_TEMPLATES[0]);
  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawTemplate = (ctx: CanvasRenderingContext2D, path: string) => {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    const p = new Path2D(path);
    ctx.stroke(p);
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid(ctx, canvas.width, canvas.height);
    drawTemplate(ctx, selectedTemplate.path);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
  };

  useEffect(() => {
    initCanvas();
  }, [selectedTemplate]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.strokeStyle = tool === 'pen' ? color : '#ffffff';
    ctx.lineWidth = tool === 'pen' ? 3 : 20;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResultImage(null);
  };

  const handleGenerate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setProcessing(true);
    try {
      const sketchBase64 = canvas.toDataURL('image/png');
      const result = await processSketch(sketchBase64, selectedTemplate.name);
      setResultImage(result);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tighter">AI Fashion Sketcher</h2>
        <p className="text-gray-500 font-medium">Draw your design and let AI bring it to life.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Templates Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Select Base</h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {DRESS_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                  selectedTemplate.id === t.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <t.icon size={20} />
                <span className="font-bold text-sm uppercase tracking-wider">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drawing Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTool('pen')}
                  className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-200'}`}
                >
                  <PenTool size={20} />
                </button>
                <button 
                  onClick={() => setTool('eraser')}
                  className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-200'}`}
                >
                  <Eraser size={20} />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearCanvas} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            {/* Canvas */}
            <div className="relative aspect-square bg-white cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full"
              />
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={processing}
            className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-gray-800 transition-all disabled:opacity-50 shadow-xl"
          >
            {processing ? (
              <>
                <Sparkles className="animate-spin" /> Generating Design...
              </>
            ) : (
              <>
                <Sparkles /> AI Detect & Render
              </>
            )}
          </button>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">AI Fashion Design</h3>
            {resultImage && (
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Rendered</span>
            )}
          </div>
          <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 bg-white overflow-hidden flex items-center justify-center relative group">
            {resultImage ? (
              <>
                <img src={resultImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="AI Result" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-xs font-bold uppercase tracking-widest">AI Generated Design</p>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="text-gray-200" size={32} />
                </div>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Your AI design will appear here</p>
                <p className="text-[10px] text-gray-200 uppercase">Draw on the canvas and click render</p>
              </div>
            )}
          </div>
          {resultImage && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = `aura-fashion-${selectedTemplate.name.toLowerCase()}.png`;
                  link.click();
                }}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg"
              >
                <Download size={18} /> Download Design
              </button>
              <button
                onClick={() => setResultImage(null)}
                className="w-full bg-white border-2 border-gray-100 text-gray-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-gray-300 hover:text-gray-600 transition-all"
              >
                <Undo size={18} /> Start New
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
