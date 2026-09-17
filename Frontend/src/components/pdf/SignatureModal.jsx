import React, { useState, useRef, useEffect } from 'react';
import { X, PenTool, Type, Upload, RotateCcw, Check, Sparkles } from 'lucide-react';

const FONTS = [
  { id: 'font-1', name: 'Great Vibes', style: 'italic 34px "Brush Script MT", cursive' },
  { id: 'font-2', name: 'Dancing Script', style: 'italic 32px "Segoe Script", cursive' },
  { id: 'font-3', name: 'Pacifico', style: 'italic 28px "Comic Sans MS", cursive' },
  { id: 'font-4', name: 'Formal Script', style: 'italic 30px "Lucida Handwriting", cursive' },
];

export default function SignatureModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [uploadedImage, setUploadedImage] = useState(null);

  // Drawing Canvas Refs
  const drawCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Clear canvas
  const handleClear = () => {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Canvas drawing events
  const startDrawing = (e) => {
    isDrawingRef.current = true;
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    lastPointRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const currentPoint = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    ctx.strokeStyle = signatureColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPointRef.current = currentPoint;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  // Handle uploaded image
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setUploadedImage(loadEvt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Final confirmation to emit DataURL
  const handleConfirm = () => {
    if (activeTab === 'draw') {
      const canvas = drawCanvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
      }
    } else if (activeTab === 'type') {
      if (!typedName.trim()) return;
      // Render typed text to offscreen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = 450;
      offscreen.height = 150;
      const ctx = offscreen.getContext('2d');
      ctx.clearRect(0, 0, 450, 150);

      const chosenFont = FONTS.find((f) => f.id === selectedFont) || FONTS[0];
      ctx.font = chosenFont.style;
      ctx.fillStyle = signatureColor;
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 20, 75);

      const dataUrl = offscreen.toDataURL('image/png');
      onSave(dataUrl);
    } else if (activeTab === 'upload') {
      if (uploadedImage) {
        onSave(uploadedImage);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <PenTool className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Digital Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'draw'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Draw
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'type'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Type
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Color Selector */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Ink Color:</span>
            <div className="flex items-center gap-2">
              {['#000000', '#1D4ED8', '#DC2626'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSignatureColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                    signatureColor === c ? 'border-indigo-500 scale-110 shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* TAB 1: DRAW CANVAS */}
          {activeTab === 'draw' && (
            <div className="relative">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/60 overflow-hidden relative shadow-inner">
                <canvas
                  ref={drawCanvasRef}
                  width={460}
                  height={170}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[170px] cursor-crosshair touch-none"
                />
                {/* Signature Base line */}
                <div className="absolute bottom-8 left-8 right-8 border-b border-dashed border-slate-300 dark:border-slate-700 pointer-events-none" />
                <span className="absolute bottom-2.5 right-4 text-[10px] text-slate-400 pointer-events-none">
                  Sign above the line
                </span>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="mt-2 text-xs font-medium text-slate-500 hover:text-rose-500 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          )}

          {/* TAB 2: TYPE SIGNATURE */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your name (e.g. John Doe)"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500">Choose Signature Style:</span>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map((font) => {
                    const isSelected = selectedFont === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFont(font.id)}
                        className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span
                          style={{
                            fontFamily: font.style.split('"')[1] || 'cursive',
                            fontStyle: 'italic',
                            color: signatureColor,
                          }}
                          className="text-lg block truncate"
                        >
                          {typedName || 'Your Signature'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD SIGNATURE IMAGE */}
          {activeTab === 'upload' && (
            <div>
              {uploadedImage ? (
                <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900 flex flex-col items-center">
                  <img src={uploadedImage} alt="Uploaded signature" className="max-h-32 object-contain" />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="mt-3 text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    Remove & Upload Another
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/30">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Click to upload signature photo or PNG
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG (transparent recommended)</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Place Signature
          </button>
        </div>
      </div>
    </div>
  );
}
