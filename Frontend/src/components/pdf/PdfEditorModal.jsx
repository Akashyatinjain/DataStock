import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  X,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Trash2,
  Type,
  PenTool,
  Highlighter,
  Square,
  Circle,
  MoveRight,
  Image,
  Stamp,
  Eye,
  Hand,
  MousePointer,
  RotateCcw,
  RotateCw as RedoIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileDown,
  Palette,
  Copy,
  Bold,
  Italic,
  Underline,
  Edit3,
} from 'lucide-react';
import { apiUrl, authFetch } from '../../utils/auth';
import { compilePdfDocument } from '../../utils/pdfCompiler';
import SignatureModal from './SignatureModal';

// Predefined Quick Business Stamps
const BUSINESS_STAMPS = [
  { id: 'approved', text: 'APPROVED', color: '#10B981', border: '#059669' },
  { id: 'confidential', text: 'CONFIDENTIAL', color: '#EF4444', border: '#DC2626' },
  { id: 'paid', text: 'PAID', color: '#3B82F6', border: '#2563EB' },
  { id: 'draft', text: 'DRAFT', color: '#F59E0B', border: '#D97706' },
  { id: 'rejected', text: 'REJECTED', color: '#6B7280', border: '#4B5563' },
];

export default function PdfEditorModal({
  file,
  isOpen,
  onClose,
  onFileSaved,
  toast,
}) {
  // Document State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [rawPdfBuffer, setRawPdfBuffer] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [loading, setLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Tool: 'select' | 'hand' | 'text' | 'pen' | 'highlighter' | 'redact' | 'block' | 'shape' | 'stamp'
  const [activeTool, setActiveTool] = useState('select');
  const [selectedShape, setSelectedShape] = useState('rectangle'); // 'rectangle' | 'circle' | 'line' | 'arrow'
  const [activeColor, setActiveColor] = useState('#3B82F6');
  const [activeBlockOpacity, setActiveBlockOpacity] = useState(1);
  const [activeBlockBorderWidth, setActiveBlockBorderWidth] = useState(0);
  const [activeBlockBorderColor, setActiveBlockBorderColor] = useState('#000000');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(2);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showStampsDropdown, setShowStampsDropdown] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Multi-Text Formatting State
  const [activeFontSize, setActiveFontSize] = useState(18);
  const [activeFontFamily, setActiveFontFamily] = useState('helvetica'); // 'helvetica' | 'times' | 'courier'
  const [activeTextBold, setActiveTextBold] = useState(false);
  const [activeTextItalic, setActiveTextItalic] = useState(false);
  const [activeTextUnderline, setActiveTextUnderline] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);

  // Annotations State: { [pageNum: number]: Array<Element> }
  const [annotationsByPage, setAnnotationsByPage] = useState({});
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Page Modifications: { [pageNum: number]: { rotation: number, isDeleted: boolean } }
  const [pageModifications, setPageModifications] = useState({});

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Drawing Refs
  const isInteractingRef = useRef(false);
  const interactionStartRef = useRef({ x: 0, y: 0 });
  const currentDrawingPointsRef = useRef([]);

  // DOM Refs
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  const fileId = file?.id;
  const fileName = file?.originalName || 'document.pdf';

  // Load PDF data on mount
  useEffect(() => {
    if (!isOpen || !fileId) return;

    setLoading(true);
    setPdfDoc(null);
    setPageNum(1);
    setAnnotationsByPage({});
    setPageModifications({});

    const fetchPdfBuffer = async () => {
      try {
        let buffer = null;

        // 1. Try file.url if available
        if (file?.url) {
          try {
            const resp = await fetch(file.url);
            if (resp.ok) buffer = await resp.arrayBuffer();
          } catch (corsErr) {
            console.warn('[PdfEditor] Direct fetch failed, falling back to download proxy');
          }
        }

        // 2. Fallback to authenticated download proxy
        if (!buffer) {
          const res = await authFetch(apiUrl(`/files/${fileId}/download`));
          if (!res.ok) throw new Error('Failed to fetch PDF data');
          buffer = await res.arrayBuffer();
        }

        setRawPdfBuffer(buffer);

        // Load into PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        console.error('[PdfEditor] Error loading PDF:', err);
        toast?.error?.('Failed to load PDF document');
      } finally {
        setLoading(false);
      }
    };

    fetchPdfBuffer();
  }, [isOpen, fileId]);

  // Render active page canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const pageMod = pageModifications[pageNum] || {};
      const userRot = pageMod.rotation || 0;

      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale, rotation: userRot });

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;

      // Also size overlay canvas to exact match
      if (overlayCanvasRef.current) {
        const oCanvas = overlayCanvasRef.current;
        oCanvas.width = canvas.width;
        oCanvas.height = canvas.height;
        oCanvas.style.width = canvas.style.width;
        oCanvas.style.height = canvas.style.height;
        redrawOverlay();
      }
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[PdfEditor] Page render error:', err);
      }
    }
  }, [pdfDoc, pageNum, scale, pageModifications]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, pageNum, scale, pageModifications, renderPage]);

  // Redraw overlay canvas (freehand ink, shapes, highlights, redactions, signatures)
  const redrawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pixelRatio = window.devicePixelRatio || 1;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const pageElements = annotationsByPage[pageNum] || [];

    pageElements.forEach((el) => {
      ctx.save();

      if (el.type === 'drawing' && el.points?.length > 1) {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'highlight') {
        ctx.fillStyle = el.color;
        ctx.globalAlpha = el.opacity || 0.35;
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'redact') {
        ctx.fillStyle = el.color || '#000000';
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'shape') {
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.strokeWidth;
        if (el.fillColor) ctx.fillStyle = el.fillColor;

        if (el.shapeType === 'rectangle') {
          if (el.fillColor) ctx.fillRect(el.x, el.y, el.width, el.height);
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        } else if (el.shapeType === 'circle') {
          ctx.beginPath();
          const r = Math.min(el.width, el.height) / 2;
          ctx.arc(el.x + r, el.y + r, r, 0, 2 * Math.PI);
          if (el.fillColor) ctx.fill();
          ctx.stroke();
        } else if (el.shapeType === 'line' || el.shapeType === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(el.x, el.y);
          ctx.lineTo(el.x + el.width, el.y + el.height);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }, [annotationsByPage, pageNum]);

  useEffect(() => {
    redrawOverlay();
  }, [annotationsByPage, pageNum, redrawOverlay]);

  // Push new element to page
  const addElementToCurrentPage = (element) => {
    const canvas = overlayCanvasRef.current;
    const canvasWidth = canvas?.clientWidth || 800;
    const canvasHeight = canvas?.clientHeight || 1100;

    const fullEl = {
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      canvasWidth,
      canvasHeight,
      ...element,
    };

    setAnnotationsByPage((prev) => {
      const currentList = prev[pageNum] || [];
      const updated = { ...prev, [pageNum]: [...currentList, fullEl] };
      pushHistory(updated);
      return updated;
    });

    return fullEl.id;
  };

  // Undo / Redo management
  const pushHistory = (state) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(JSON.parse(JSON.stringify(state)));
    if (newHist.length > 25) newHist.shift();
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotationsByPage(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotationsByPage(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Element Mutation Helpers
  const updateElement = (elementId, updates) => {
    setAnnotationsByPage((prev) => {
      const currentList = prev[pageNum] || [];
      const updated = {
        ...prev,
        [pageNum]: currentList.map((item) =>
          item.id === elementId ? { ...item, ...updates } : item
        ),
      };
      pushHistory(updated);
      return updated;
    });
  };

  const deleteElement = (elementId) => {
    setAnnotationsByPage((prev) => {
      const currentList = prev[pageNum] || [];
      const updated = {
        ...prev,
        [pageNum]: currentList.filter((item) => item.id !== elementId),
      };
      pushHistory(updated);
      return updated;
    });
    setSelectedElementId(null);
  };

  const duplicateElement = (el) => {
    const newEl = {
      ...el,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: el.x + 20,
      y: el.y + 20,
    };
    setAnnotationsByPage((prev) => {
      const currentList = prev[pageNum] || [];
      const updated = {
        ...prev,
        [pageNum]: [...currentList, newEl],
      };
      pushHistory(updated);
      return updated;
    });
    setSelectedElementId(newEl.id);
  };

  // Layer 3 Interactive Drag & Move for HTML elements
  const handleElementPointerDown = (e, el) => {
    if (e.target.closest('.no-drag')) return;
    e.stopPropagation();
    setSelectedElementId(el.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;

    const onPointerMove = (moveEvt) => {
      const deltaX = moveEvt.clientX - startX;
      const deltaY = moveEvt.clientY - startY;
      const nextX = Math.max(0, Math.round(origX + deltaX));
      const nextY = Math.max(0, Math.round(origY + deltaY));

      setAnnotationsByPage((prev) => ({
        ...prev,
        [pageNum]: (prev[pageNum] || []).map((item) =>
          item.id === el.id ? { ...item, x: nextX, y: nextY } : item
        ),
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setAnnotationsByPage((curr) => {
        pushHistory(curr);
        return curr;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Layer 3 Interactive Corner Resize
  const handleResizePointerDown = (e, el) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = el.width || 120;
    const origH = el.height || 60;

    const onPointerMove = (moveEvt) => {
      const deltaX = moveEvt.clientX - startX;
      const deltaY = moveEvt.clientY - startY;
      const nextW = Math.max(24, Math.round(origW + deltaX));
      const nextH = Math.max(16, Math.round(origH + deltaY));

      setAnnotationsByPage((prev) => ({
        ...prev,
        [pageNum]: (prev[pageNum] || []).map((item) =>
          item.id === el.id ? { ...item, width: nextW, height: nextH } : item
        ),
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setAnnotationsByPage((curr) => {
        pushHistory(curr);
        return curr;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Canvas Mouse & Touch Events for interactive drawing/shape creation
  const handleOverlayMouseDown = (e) => {
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isInteractingRef.current = true;
    interactionStartRef.current = { x, y };
    setSelectedElementId(null);
    setEditingTextId(null);

    if (activeTool === 'pen') {
      currentDrawingPointsRef.current = [{ x, y }];
    } else if (activeTool === 'text') {
      const id = addElementToCurrentPage({
        type: 'text',
        x,
        y,
        text: 'Sample Text',
        fontSize: activeFontSize || 18,
        color: activeColor,
        fontFamily: activeFontFamily || 'helvetica',
        bold: activeTextBold,
        italic: activeTextItalic,
        underline: activeTextUnderline,
        backgroundColor: 'transparent',
      });
      setSelectedElementId(id);
      setEditingTextId(id);
      isInteractingRef.current = false;
    }
  };

  const handleOverlayMouseMove = (e) => {
    if (!isInteractingRef.current) return;
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pen') {
      currentDrawingPointsRef.current.push({ x, y });
      const ctx = overlayCanvasRef.current.getContext('2d');
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = activeStrokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const pts = currentDrawingPointsRef.current;
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleOverlayMouseUp = (e) => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const startX = interactionStartRef.current.x;
    const startY = interactionStartRef.current.y;

    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const originX = Math.min(startX, endX);
    const originY = Math.min(startY, endY);

    if (activeTool === 'pen') {
      if (currentDrawingPointsRef.current.length > 1) {
        addElementToCurrentPage({
          type: 'drawing',
          points: [...currentDrawingPointsRef.current],
          color: activeColor,
          strokeWidth: activeStrokeWidth,
        });
      }
      currentDrawingPointsRef.current = [];
    } else if (activeTool === 'highlighter' && (width > 5 || height > 5)) {
      addElementToCurrentPage({
        type: 'highlight',
        x: originX,
        y: originY,
        width: Math.max(width, 20),
        height: Math.max(height, 16),
        color: '#FACC15', // Yellow
        opacity: 0.35,
      });
    } else if (activeTool === 'redact' && (width > 5 || height > 5)) {
      addElementToCurrentPage({
        type: 'redact',
        x: originX,
        y: originY,
        width: Math.max(width, 20),
        height: Math.max(height, 16),
        color: '#000000',
      });
    } else if (activeTool === 'block') {
      const finalW = width > 15 ? width : 160;
      const finalH = height > 15 ? height : 75;
      const finalX = width > 15 ? originX : Math.max(0, endX - 80);
      const finalY = width > 15 ? originY : Math.max(0, endY - 37);

      const newId = addElementToCurrentPage({
        type: 'block',
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH,
        color: activeColor,
        opacity: activeBlockOpacity,
        borderWidth: activeBlockBorderWidth,
        borderColor: activeBlockBorderWidth > 0 ? activeBlockBorderColor : undefined,
        borderRadius: 4,
      });
      setSelectedElementId(newId);
    } else if (activeTool === 'shape' && (width > 5 || height > 5)) {
      addElementToCurrentPage({
        type: 'shape',
        shapeType: selectedShape,
        x: originX,
        y: originY,
        width,
        height,
        strokeColor: activeColor,
        strokeWidth: activeStrokeWidth,
      });
    }
  };

  // Add digital signature
  const handlePlaceSignature = (signatureDataUrl) => {
    addElementToCurrentPage({
      type: 'signature',
      dataUrl: signatureDataUrl,
      x: 100,
      y: 100,
      width: 140,
      height: 60,
    });
    toast?.success?.('Signature placed! Click and drag to reposition.');
  };

  // Add business stamp
  const handlePlaceStamp = (stamp) => {
    // Generate stamp canvas image
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = stamp.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 172, 52);

    ctx.fillStyle = stamp.color;
    ctx.font = 'bold 20px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp.text, 90, 30);

    const dataUrl = canvas.toDataURL('image/png');

    addElementToCurrentPage({
      type: 'stamp',
      dataUrl,
      x: 80,
      y: 80,
      width: 140,
      height: 48,
    });
    setShowStampsDropdown(false);
  };

  // Rotate current page 90 degrees
  const handleRotatePage = (targetPage = pageNum) => {
    setPageModifications((prev) => {
      const current = prev[targetPage]?.rotation || 0;
      return {
        ...prev,
        [targetPage]: { ...prev[targetPage], rotation: (current + 90) % 360 },
      };
    });
  };

  // Delete page
  const handleDeletePage = (targetPage = pageNum) => {
    if (numPages <= 1) {
      toast?.error?.('Cannot delete the only page in the document');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove Page ${targetPage}?`)) return;

    setPageModifications((prev) => ({
      ...prev,
      [targetPage]: { ...prev[targetPage], isDeleted: true },
    }));

    if (pageNum === targetPage && pageNum > 1) {
      setPageNum(pageNum - 1);
    }
  };

  // Compile and Save or Download
  const handleCompileAndExport = async (action = 'download') => {
    if (!rawPdfBuffer) return;
    setIsCompiling(true);

    try {
      const compiledBytes = await compilePdfDocument(
        rawPdfBuffer,
        annotationsByPage,
        pageModifications
      );

      const blob = new Blob([compiledBytes], { type: 'application/pdf' });

      if (action === 'download') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.replace(/\.[^/.]+$/, '') + '_edited.pdf';
        a.click();
        URL.revokeObjectURL(url);
        toast?.success?.('Compiled PDF downloaded!');
      } else if (action === 'cloud') {
        // Create FormData and upload as a new version to DataStock
        const editedFile = new File([blob], fileName, { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('file', editedFile);
        formData.append('fileId', fileId);

        const res = await authFetch(apiUrl('/files/upload'), {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSaveSuccess(true);
          toast?.success?.('Saved new PDF version to DataStock cloud!');
          onFileSaved?.();
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          toast?.error?.(data.message || 'Failed to save PDF to cloud');
        }
      }
    } catch (err) {
      console.error('[PdfEditor] Compilation error:', err);
      toast?.error?.('Error compiling PDF: ' + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  const selectedElement = (annotationsByPage[pageNum] || []).find(
    (el) => el.id === selectedElementId
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 select-none animate-fade-in">
      {/* ========================================================= */}
      {/* TOP HEADER & TOOLBAR                                      */}
      {/* ========================================================= */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 bg-white dark:bg-[#0F172A] shrink-0">
        {/* Left: Document Info & Page Manager Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              showThumbnails
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Page Thumbnails"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
            {fileName}
          </h3>
        </div>

        {/* Center: Page Controls & Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {pageNum} / {numPages}
          </span>
          <button
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
            disabled={pageNum >= numPages}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-500">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Save & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            disabled={isCompiling}
            onClick={() => handleCompileAndExport('download')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            title="Download compiled PDF binary"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            disabled={isCompiling}
            onClick={() => handleCompileAndExport('cloud')}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compiling...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save to Cloud
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* SECONDARY TOOLBAR: EDITING & ANNOTATION TOOLS             */}
      {/* ========================================================= */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#0B1120] shrink-0 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5">
          {/* Select Tool */}
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'select'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Select & Move"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Add Text */}
          <button
            onClick={() => setActiveTool('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'text'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Add Text to PDF"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Text</span>
          </button>

          {/* Freehand Pen */}
          <button
            onClick={() => setActiveTool('pen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Draw Freehand Ink"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Draw</span>
          </button>

          {/* Text Highlighter */}
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'highlighter'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Highlight Text Lines"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          {/* Redact Censorship Tool */}
          <button
            onClick={() => setActiveTool('redact')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'redact'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Redact / Censor Sensitive Data"
          >
            <Square className="w-4 h-4 fill-black" />
            <span className="hidden sm:inline">Redact</span>
          </button>

          {/* Color Block Tool (Any Color Box) */}
          <button
            onClick={() => setActiveTool('block')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTool === 'block'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Add Block of Any Color (Click or Drag to Draw)"
          >
            <div
              className="w-3.5 h-3.5 rounded-xs border border-slate-400 dark:border-slate-500 shadow-2xs"
              style={{ backgroundColor: activeColor }}
            />
            <span className="hidden sm:inline">Color Block</span>
          </button>

          {/* Digital Signature Modal Trigger */}
          <button
            onClick={() => setShowSignatureModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition cursor-pointer"
            title="Insert Digital Signature"
          >
            <PenTool className="w-4 h-4" />
            <span>Sign</span>
          </button>

          {/* Stamps Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStampsDropdown(!showStampsDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer"
              title="Add Business Stamp"
            >
              <Stamp className="w-4 h-4" />
              <span>Stamp</span>
            </button>

            {showStampsDropdown && (
              <div className="absolute top-10 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 w-44 space-y-1 animate-fade-in">
                {BUSINESS_STAMPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handlePlaceStamp(s)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    style={{ color: s.color }}
                  >
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Any-Color Picker, Palette Swatches, Opacity & Controls */}
        <div className="flex items-center gap-2">
          {/* Contextual Text Formatting Toolbar */}
          {(activeTool === 'text' || selectedElement?.type === 'text') && (
            <div className="flex items-center gap-1 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-lg p-0.5 text-[11px] animate-fade-in">
              {/* Font Family selector */}
              <select
                value={selectedElement?.fontFamily || activeFontFamily}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveFontFamily(val);
                  if (selectedElement) updateElement(selectedElement.id, { fontFamily: val });
                }}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-medium rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
                title="Font Family"
              >
                <option value="helvetica">Sans (Helvetica)</option>
                <option value="times">Serif (Times)</option>
                <option value="courier">Mono (Courier)</option>
              </select>

              {/* Font Size stepper */}
              <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 px-1 py-0.5">
                <button
                  onClick={() => {
                    const currentSz = selectedElement?.fontSize || activeFontSize;
                    const nextSz = Math.max(8, currentSz - 2);
                    setActiveFontSize(nextSz);
                    if (selectedElement) updateElement(selectedElement.id, { fontSize: nextSz });
                  }}
                  className="px-1 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="Decrease font size"
                >
                  -
                </button>
                <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-1">
                  {selectedElement?.fontSize || activeFontSize}
                </span>
                <button
                  onClick={() => {
                    const currentSz = selectedElement?.fontSize || activeFontSize;
                    const nextSz = Math.min(72, currentSz + 2);
                    setActiveFontSize(nextSz);
                    if (selectedElement) updateElement(selectedElement.id, { fontSize: nextSz });
                  }}
                  className="px-1 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  title="Increase font size"
                >
                  +
                </button>
              </div>

              {/* Bold (B) */}
              <button
                onClick={() => {
                  const currentBold = selectedElement ? selectedElement.bold : activeTextBold;
                  const nextBold = !currentBold;
                  setActiveTextBold(nextBold);
                  if (selectedElement) updateElement(selectedElement.id, { bold: nextBold });
                }}
                className={`p-1 rounded transition cursor-pointer font-black ${
                  (selectedElement ? selectedElement.bold : activeTextBold)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Italic (I) */}
              <button
                onClick={() => {
                  const currentItalic = selectedElement ? selectedElement.italic : activeTextItalic;
                  const nextItalic = !currentItalic;
                  setActiveTextItalic(nextItalic);
                  if (selectedElement) updateElement(selectedElement.id, { italic: nextItalic });
                }}
                className={`p-1 rounded transition cursor-pointer italic ${
                  (selectedElement ? selectedElement.italic : activeTextItalic)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </button>

              {/* Underline (U) */}
              <button
                onClick={() => {
                  const currentUnderline = selectedElement ? selectedElement.underline : activeTextUnderline;
                  const nextUnderline = !currentUnderline;
                  setActiveTextUnderline(nextUnderline);
                  if (selectedElement) updateElement(selectedElement.id, { underline: nextUnderline });
                }}
                className={`p-1 rounded transition cursor-pointer underline ${
                  (selectedElement ? selectedElement.underline : activeTextUnderline)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Underline"
              >
                <Underline className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Custom ANY-COLOR Picker */}
          <label
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-lg px-2 py-1 shadow-2xs cursor-pointer group transition-colors"
            title="Pick ANY custom color from color spectrum"
          >
            <Palette className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <input
              type="color"
              value={activeColor}
              onChange={(e) => {
                const c = e.target.value;
                setActiveColor(c);
                if (selectedElementId) {
                  updateElement(selectedElementId, { color: c });
                }
              }}
              className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 uppercase">
              {activeColor}
            </span>
          </label>

          {/* Quick Palette Swatches */}
          <div className="flex items-center gap-1">
            {[
              '#3B82F6', // Blue
              '#10B981', // Emerald
              '#EF4444', // Red
              '#F59E0B', // Amber
              '#8B5CF6', // Purple
              '#EC4899', // Pink
              '#06B6D4', // Cyan
              '#000000', // Black
              '#FFFFFF', // White
            ].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setActiveColor(c);
                  if (selectedElementId) {
                    updateElement(selectedElementId, { color: c });
                  }
                }}
                className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                  activeColor === c
                    ? 'ring-2 ring-indigo-500 scale-110 shadow-xs'
                    : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          {/* Block Opacity Controls */}
          <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800/90 p-0.5 rounded-lg text-[10px]">
            <span className="text-slate-400 dark:text-slate-500 px-1 font-medium hidden lg:inline">Opacity:</span>
            {[1, 0.75, 0.5, 0.25].map((op) => (
              <button
                key={op}
                onClick={() => {
                  setActiveBlockOpacity(op);
                  if (selectedElementId) {
                    updateElement(selectedElementId, { opacity: op });
                  }
                }}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer font-bold ${
                  activeBlockOpacity === op
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Block Opacity ${Math.round(op * 100)}%`}
              >
                {Math.round(op * 100)}%
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Rotate Page Button */}
          <button
            onClick={() => handleRotatePage(pageNum)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Rotate Current Page 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Delete Page Button */}
          <button
            onClick={() => handleDeletePage(pageNum)}
            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 cursor-pointer"
            title="Delete Current Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Redo"
          >
            <RedoIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* WORKSPACE: THUMBNAILS SIDEBAR + PDF CANVAS CANVAS         */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Manager (Collapsible) */}
        {showThumbnails && (
          <aside className="w-48 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3 overflow-y-auto flex flex-col gap-3 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pages ({numPages})
            </span>
            {Array.from({ length: numPages }).map((_, idx) => {
              const p = idx + 1;
              const isCurrent = pageNum === p;
              const isDeleted = pageModifications[p]?.isDeleted;
              return (
                <div
                  key={p}
                  onClick={() => !isDeleted && setPageNum(p)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer relative group ${
                    isDeleted
                      ? 'opacity-30 line-through border-rose-500'
                      : isCurrent
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="w-full h-24 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 mb-1 flex items-center justify-center text-xs font-mono text-slate-400 shadow-xs">
                    {p}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page {p}
                  </span>
                </div>
              );
            })}
          </aside>
        )}

        {/* Central PDF Canvas Workspace */}
        <main
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-200/50 dark:bg-[#060911] p-8 flex items-center justify-center relative"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold text-slate-400">Loading high-resolution PDF canvas...</p>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
              {/* Layer 1: PDF.js rendered page canvas */}
              <canvas ref={canvasRef} className="block select-none pointer-events-none" />

              {/* Layer 2: Interactive annotation overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                className="absolute inset-0 cursor-crosshair touch-none"
              />

              {/* Layer 3: Rendered HTML Element Overlays (Text / Signatures / Stamps / Blocks) */}
              {(annotationsByPage[pageNum] || []).map((el) => {
                if (el.type === 'drawing' || el.type === 'highlight' || el.type === 'redact' || el.type === 'shape') {
                  return null; // rendered on overlay canvas
                }

                const isSelected = selectedElementId === el.id;

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                    }}
                    className={`absolute group cursor-move select-none ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 ring-offset-1 z-30'
                        : 'hover:ring-1 hover:ring-indigo-400/50 z-20'
                    }`}
                  >
                    {/* Block Element of Any Color */}
                    {el.type === 'block' && (
                      <div
                        className="w-full h-full rounded transition-shadow"
                        style={{
                          backgroundColor: el.color || '#3B82F6',
                          opacity: el.opacity !== undefined ? el.opacity : 1,
                          border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000000'}` : 'none',
                          boxShadow: isSelected ? '0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none',
                        }}
                      />
                    )}

                    {/* Text Element (with Inline Editing & Full Typography) */}
                    {el.type === 'text' && (
                      editingTextId === el.id ? (
                        <textarea
                          autoFocus
                          value={el.text}
                          onChange={(e) => updateElement(el.id, { text: e.target.value })}
                          onBlur={() => setEditingTextId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingTextId(null);
                          }}
                          style={{
                            color: el.color || '#000000',
                            fontSize: `${el.fontSize || 16}px`,
                            fontFamily:
                              el.fontFamily === 'times'
                                ? 'Times New Roman, serif'
                                : el.fontFamily === 'courier'
                                ? 'Courier New, monospace'
                                : 'Inter, system-ui, sans-serif',
                            fontWeight: el.bold ? 'bold' : 'normal',
                            fontStyle: el.italic ? 'italic' : 'normal',
                            textDecoration: el.underline ? 'underline' : 'none',
                            backgroundColor: el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'white',
                          }}
                          className="no-drag min-w-[140px] resize-none border-2 border-indigo-500 rounded p-1 shadow-lg focus:outline-none bg-white text-slate-900"
                          rows={Math.max(1, String(el.text).split('\n').length)}
                        />
                      ) : (
                        <div
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingTextId(el.id);
                          }}
                          style={{
                            color: el.color || '#000000',
                            fontSize: `${el.fontSize || 16}px`,
                            fontFamily:
                              el.fontFamily === 'times'
                                ? 'Times New Roman, serif'
                                : el.fontFamily === 'courier'
                                ? 'Courier New, monospace'
                                : 'Inter, system-ui, sans-serif',
                            fontWeight: el.bold ? 'bold' : 'normal',
                            fontStyle: el.italic ? 'italic' : 'normal',
                            textDecoration: el.underline ? 'underline' : 'none',
                            backgroundColor: el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'transparent',
                          }}
                          className="px-1.5 py-0.5 whitespace-pre-wrap select-none cursor-pointer rounded"
                          title="Double-click to edit text"
                        >
                          {el.text}
                        </div>
                      )
                    )}

                    {/* Signature / Stamp / Image */}
                    {(el.type === 'signature' || el.type === 'stamp' || el.type === 'image') && el.dataUrl && (
                      <img src={el.dataUrl} alt="element" className="w-full h-full object-contain pointer-events-none" />
                    )}

                    {/* Floating mini-bar for selected element */}
                    {isSelected && (
                      <div
                        className="no-drag absolute -top-8 left-0 flex items-center gap-1 bg-slate-900 text-white rounded-lg px-2 py-0.5 shadow-xl text-[10px] z-50 whitespace-nowrap animate-fade-in"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {/* Text Element Formatting Options */}
                        {el.type === 'text' && (
                          <>
                            {/* Edit text inline */}
                            <button
                              onClick={() => setEditingTextId(editingTextId === el.id ? null : el.id)}
                              className={`p-1 rounded transition cursor-pointer ${
                                editingTextId === el.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                              }`}
                              title="Edit Text Inline"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />

                            {/* Font Family selector */}
                            <select
                              value={el.fontFamily || 'helvetica'}
                              onChange={(e) => updateElement(el.id, { fontFamily: e.target.value })}
                              className="bg-slate-800 text-slate-200 text-[10px] rounded px-1 py-0.5 border border-slate-700 focus:outline-none cursor-pointer"
                              title="Font Family"
                            >
                              <option value="helvetica">Sans</option>
                              <option value="times">Serif</option>
                              <option value="courier">Mono</option>
                            </select>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />

                            {/* Font Size stepper */}
                            <div className="flex items-center bg-slate-800 rounded px-1 py-0.5">
                              <button
                                onClick={() => updateElement(el.id, { fontSize: Math.max(8, (el.fontSize || 16) - 2) })}
                                className="px-1 hover:text-white text-slate-400 font-bold cursor-pointer"
                                title="Decrease font size"
                              >
                                -
                              </button>
                              <span className="font-mono text-[10px] px-1 font-bold text-indigo-400">
                                {el.fontSize || 16}
                              </span>
                              <button
                                onClick={() => updateElement(el.id, { fontSize: Math.min(72, (el.fontSize || 16) + 2) })}
                                className="px-1 hover:text-white text-slate-400 font-bold cursor-pointer"
                                title="Increase font size"
                              >
                                +
                              </button>
                            </div>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />

                            {/* Bold (B) */}
                            <button
                              onClick={() => updateElement(el.id, { bold: !el.bold })}
                              className={`p-1 rounded font-black transition cursor-pointer ${
                                el.bold ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                              }`}
                              title="Bold"
                            >
                              <Bold className="w-3 h-3" />
                            </button>

                            {/* Italic (I) */}
                            <button
                              onClick={() => updateElement(el.id, { italic: !el.italic })}
                              className={`p-1 rounded italic transition cursor-pointer ${
                                el.italic ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                              }`}
                              title="Italic"
                            >
                              <Italic className="w-3 h-3" />
                            </button>

                            {/* Underline (U) */}
                            <button
                              onClick={() => updateElement(el.id, { underline: !el.underline })}
                              className={`p-1 rounded underline transition cursor-pointer ${
                                el.underline ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                              }`}
                              title="Underline"
                            >
                              <Underline className="w-3 h-3" />
                            </button>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />

                            {/* Text Color Picker */}
                            <label className="flex items-center gap-1 cursor-pointer pr-1" title="Pick text color">
                              <span className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: el.color || '#000000' }} />
                              <input
                                type="color"
                                value={el.color || '#000000'}
                                onChange={(e) => updateElement(el.id, { color: e.target.value })}
                                className="w-0 h-0 opacity-0 absolute pointer-events-none"
                              />
                            </label>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />

                            {/* Background Highlight toggle */}
                            <button
                              onClick={() => {
                                const nextBg =
                                  !el.backgroundColor || el.backgroundColor === 'transparent'
                                    ? '#FEF08A'
                                    : el.backgroundColor === '#FEF08A'
                                    ? '#FFFFFF'
                                    : el.backgroundColor === '#FFFFFF'
                                    ? '#CFFAFE'
                                    : 'transparent';
                                updateElement(el.id, { backgroundColor: nextBg });
                              }}
                              className="px-1 py-0.5 rounded hover:bg-slate-800 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                              title="Toggle Text Background Highlight (None -> Yellow -> White -> Cyan)"
                            >
                              {el.backgroundColor && el.backgroundColor !== 'transparent' ? '🖍️' : 'Bg'}
                            </button>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />
                          </>
                        )}

                        {/* Color Block Formatting Options */}
                        {el.type === 'block' && (
                          <>
                            <label className="flex items-center gap-1 cursor-pointer pr-1 border-r border-slate-700" title="Change Color">
                              <span className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ backgroundColor: el.color }} />
                              <input
                                type="color"
                                value={el.color || '#3B82F6'}
                                onChange={(e) => updateElement(el.id, { color: e.target.value })}
                                className="w-0 h-0 opacity-0 absolute pointer-events-none"
                              />
                            </label>
                            <span className="font-mono text-slate-300 uppercase">{el.color}</span>
                            <div className="h-2.5 w-px bg-slate-700 mx-0.5" />
                            <button
                              onClick={() => {
                                const nextOp = el.opacity === 1 ? 0.75 : el.opacity === 0.75 ? 0.5 : el.opacity === 0.5 ? 0.25 : 1;
                                updateElement(el.id, { opacity: nextOp });
                              }}
                              className="px-1 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer font-bold"
                              title="Toggle Opacity (100% -> 75% -> 50% -> 25%)"
                            >
                              {Math.round((el.opacity !== undefined ? el.opacity : 1) * 100)}%
                            </button>
                            <div className="h-2.5 w-px bg-slate-700 mx-0.5" />
                          </>
                        )}
                        <button
                          onClick={() => duplicateElement(el)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                          title="Duplicate Element"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteElement(el.id)}
                          className="p-1 rounded hover:bg-rose-950 text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="Delete Element"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Resize handle at bottom-right corner */}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, el)}
                        className="no-drag absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-md z-50 hover:scale-125 transition-transform"
                        title="Drag to resize"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handlePlaceSignature}
        />
      )}
    </div>
  );
}
