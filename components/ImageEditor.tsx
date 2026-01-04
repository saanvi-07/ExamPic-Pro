
import React, { useState, useRef, useEffect } from 'react';
import { ImageTransform, DimensionRequirement } from '../types';

interface ImageEditorProps {
  imageSrc: string;
  targetDims: DimensionRequirement;
  onSave: (transform: ImageTransform) => void;
  onCancel: () => void;
  t: any;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'move' | null;

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, targetDims, onSave, onCancel, t }) => {
  const INITIAL_TRANSFORM: ImageTransform = {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    fineRotate: 0,
    brightness: 100,
    contrast: 100,
  };

  const [transform, setTransform] = useState<ImageTransform>(INITIAL_TRANSFORM);
  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, transformX: 0, transformY: 0, scale: 1 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const aspectRatio = targetDims.width / targetDims.height;
  const viewportWidth = 320;
  const viewportHeight = viewportWidth / aspectRatio;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const scaleX = viewportWidth / img.width;
      const scaleY = viewportHeight / img.height;
      setTransform(prev => ({ ...prev, scale: Math.max(scaleX, scaleY) }));
    };
    img.src = imageSrc;
  }, [imageSrc, viewportWidth, viewportHeight]);

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setActiveHandle(type);
    setDragStart({ 
      x: clientX, 
      y: clientY, 
      transformX: transform.x, 
      transformY: transform.y,
      scale: transform.scale
    });
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeHandle) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    if (activeHandle === 'move') {
      setTransform(prev => ({
        ...prev,
        x: dragStart.transformX + dx,
        y: dragStart.transformY + dy,
      }));
    } else {
      // Corner Resizing Logic
      // In this specialized UI, dragging corners "inwards" is perceived as zooming IN 
      // because we are selecting a smaller area for the fixed-size output.
      // We'll calculate a scale multiplier based on movement.
      let multiplier = 1;
      
      // Calculate how much the user "shrunk" the box visually
      // Horizontal movement contributes to scaling
      const sensitivity = 0.005;
      
      if (activeHandle === 'nw' || activeHandle === 'sw') {
        multiplier = 1 - (dx * sensitivity);
      } else {
        multiplier = 1 + (dx * sensitivity);
      }

      setTransform(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(10, dragStart.scale * multiplier))
      }));
    }
  };

  const handleInteractionEnd = () => {
    setActiveHandle(null);
  };

  const handleRotate90 = () => {
    setTransform(prev => ({ ...prev, rotate: (prev.rotate + 90) % 360 }));
  };

  const handleReset = () => {
    setTransform(INITIAL_TRANSFORM);
    const img = new Image();
    img.onload = () => {
      const scaleX = viewportWidth / img.width;
      const scaleY = viewportHeight / img.height;
      setTransform(prev => ({ ...prev, scale: Math.max(scaleX, scaleY) }));
    };
    img.src = imageSrc;
  };

  const updateFineRotate = (val: number) => {
    setTransform(prev => ({ ...prev, fineRotate: Math.min(45, Math.max(-45, val)) }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4">
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col"
        onMouseMove={handleInteractionMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onTouchMove={handleInteractionMove}
        onTouchEnd={handleInteractionEnd}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{t.alignTitle}</h3>
            <p className="text-sm text-slate-500">{t.dragHint}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleReset} 
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
            >
              {t.reset}
            </button>
            <button onClick={onCancel} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Main Preview Area */}
            <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative">
              <div 
                ref={containerRef}
                className="relative bg-slate-200 border-[3px] border-white shadow-2xl rounded-sm group"
                style={{ width: viewportWidth, height: viewportHeight }}
              >
                {/* Interaction Overlay for Panning */}
                <div 
                  className="absolute inset-0 z-10 cursor-move"
                  onMouseDown={(e) => handleInteractionStart(e, 'move')}
                  onTouchStart={(e) => handleInteractionStart(e, 'move')}
                />

                {/* The Image */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img 
                    ref={imgRef}
                    src={imageSrc} 
                    alt="Editor" 
                    className="absolute origin-center"
                    style={{
                      transform: `translate(calc(-50% + ${viewportWidth/2 + transform.x}px), calc(-50% + ${viewportHeight/2 + transform.y}px)) rotate(${transform.rotate + transform.fineRotate}deg) scale(${transform.scale})`,
                      filter: `brightness(${transform.brightness}%) contrast(${transform.contrast}%)`,
                      maxWidth: 'none'
                    }}
                  />
                </div>
                
                {/* Visual Guides: Grid */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20 group-hover:opacity-40 transition-opacity z-20">
                  <div className="border-r border-white"></div>
                  <div className="border-r border-white"></div>
                  <div></div>
                  <div className="border-b border-t border-white col-span-3"></div>
                  <div className="border-b border-white col-span-3"></div>
                </div>

                {/* Viewport Mask Overlay */}
                <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] z-20"></div>

                {/* Crop Handles */}
                <div className="absolute inset-0 pointer-events-none z-30">
                  {/* Top Left */}
                  <div 
                    className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-indigo-400 cursor-nw-resize pointer-events-auto rounded-tl-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleInteractionStart(e, 'nw')}
                    onTouchStart={(e) => handleInteractionStart(e, 'nw')}
                  />
                  {/* Top Right */}
                  <div 
                    className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-indigo-400 cursor-ne-resize pointer-events-auto rounded-tr-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleInteractionStart(e, 'ne')}
                    onTouchStart={(e) => handleInteractionStart(e, 'ne')}
                  />
                  {/* Bottom Left */}
                  <div 
                    className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-indigo-400 cursor-sw-resize pointer-events-auto rounded-bl-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleInteractionStart(e, 'sw')}
                    onTouchStart={(e) => handleInteractionStart(e, 'sw')}
                  />
                  {/* Bottom Right */}
                  <div 
                    className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-indigo-400 cursor-se-resize pointer-events-auto rounded-br-sm hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleInteractionStart(e, 'se')}
                    onTouchStart={(e) => handleInteractionStart(e, 'se')}
                  />
                </div>
              </div>
              
              <div className="mt-8 flex items-center space-x-2 text-xs font-medium text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3.5" /></svg>
                <span>{t.dragHint}</span>
              </div>
            </div>

            {/* Controls Sidebar */}
            <div className="w-full lg:w-96 bg-white border-l border-slate-100 p-8 space-y-10 flex-shrink-0 overflow-y-auto">
              
              {/* Zoom Control */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.zoom}</label>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">{Math.round(transform.scale * 100)}%</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={() => setTransform(p => ({...p, scale: Math.max(0.1, p.scale - 0.1)}))} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </button>
                  <input 
                    type="range" min="0.1" max="5" step="0.01" 
                    value={transform.scale} 
                    onChange={(e) => setTransform(prev => ({...prev, scale: parseFloat(e.target.value)}))}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <button onClick={() => setTransform(p => ({...p, scale: Math.min(5, p.scale + 0.1)}))} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </div>

              {/* Precise Rotation (Tilt) */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.fineRotate}</label>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">{transform.fineRotate}°</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => updateFineRotate(transform.fineRotate - 1)} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                    -1°
                  </button>
                  <input 
                    type="range" min="-45" max="45" step="1" 
                    value={transform.fineRotate} 
                    onChange={(e) => updateFineRotate(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <button onClick={() => updateFineRotate(transform.fineRotate + 1)} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                    +1°
                  </button>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={handleRotate90} 
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition-all"
                   >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>90° {t.rotate}</span>
                  </button>
                  <button 
                    onClick={() => updateFineRotate(0)} 
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition-all"
                   >
                    {t.reset}
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* Adjustments: Brightness & Contrast */}
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.brightness}</label>
                    <span className="text-xs font-bold text-slate-400">{transform.brightness}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" step="1" 
                    value={transform.brightness} 
                    onChange={(e) => setTransform(prev => ({...prev, brightness: parseInt(e.target.value)}))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-400"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.contrast}</label>
                    <span className="text-xs font-bold text-slate-400">{transform.contrast}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" step="1" 
                    value={transform.contrast} 
                    onChange={(e) => setTransform(prev => ({...prev, contrast: parseInt(e.target.value)}))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-400"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 flex-shrink-0">
          <button onClick={onCancel} className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all">
            {t.cancel}
          </button>
          <button 
            onClick={() => onSave(transform)} 
            className="flex-1 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200"
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};
