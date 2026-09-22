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
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Wand2,
  Edit3,
  FileText,
} from 'lucide-react';
import { apiUrl, authFetch } from '../../utils/auth';
import { compilePdfDocument } from '../../utils/pdfCompiler';
import SignatureModal from './SignatureModal';
import {
  FONT_CATEGORIES,
  FONT_MAP,
  getCssFontFamily,
  classifyPdfFont,
  isFontNameBold,
  isFontNameItalic,
  loadPdfEditorFonts,
} from './fontConstants';

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
  const [baseFitScale, setBaseFitScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Tool: 'select' | 'hand' | 'text' | 'pen' | 'highlighter' | 'redact' | 'block' | 'shape' | 'stamp'
  const [activeTool, setActiveTool] = useState('select');
  const [selectedShape, setSelectedShape] = useState('rectangle'); // 'rectangle' | 'circle' | 'line' | 'arrow'
  const [activeColor, setActiveColor] = useState('#3B82F6');
  const [activeRedactColor, setActiveRedactColor] = useState('#000000');
  const [activeBlockOpacity, setActiveBlockOpacity] = useState(1);
  const [activeBlockBorderWidth, setActiveBlockBorderWidth] = useState(0);
  const [activeBlockBorderColor, setActiveBlockBorderColor] = useState('#000000');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(2);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showStampsDropdown, setShowStampsDropdown] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Multi-Text Formatting State
  const [activeFontSize, setActiveFontSize] = useState(18);
  const [activeFontFamily, setActiveFontFamily] = useState('helvetica');
  const [activeTextBold, setActiveTextBold] = useState(false);
  const [activeTextItalic, setActiveTextItalic] = useState(false);
  const [activeTextUnderline, setActiveTextUnderline] = useState(false);
  const [activeTextStrikethrough, setActiveTextStrikethrough] = useState(false);
  const [activeTextAlign, setActiveTextAlign] = useState('left'); // 'left' | 'center' | 'right'
  const [editingTextId, setEditingTextId] = useState(null);
  const [isDetectingStyle, setIsDetectingStyle] = useState(false);

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

    loadPdfEditorFonts();
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

        // Auto-fit initial scale to container height & width
        try {
          const firstPage = await doc.getPage(1);
          const unscaledVp = firstPage.getViewport({ scale: 1.0 });
          const container = containerRef.current;
          if (container && unscaledVp.width && unscaledVp.height) {
            const padX = window.innerWidth < 640 ? 16 : 48;
            const padY = window.innerWidth < 640 ? 16 : 48;
            const availW = Math.max(200, container.clientWidth - padX);
            const availH = Math.max(200, container.clientHeight - padY);
            const fitScale = Math.min(availW / unscaledVp.width, availH / unscaledVp.height);
            const clamped = Math.max(0.35, Math.min(2.0, Number(fitScale.toFixed(2))));
            setScale(clamped);
            setBaseFitScale(clamped);
          } else {
            const defScale = window.innerWidth < 640 ? 0.55 : 0.75;
            setScale(defScale);
            setBaseFitScale(defScale);
          }
        } catch (_) {
          const defScale = window.innerWidth < 640 ? 0.55 : 0.75;
          setScale(defScale);
          setBaseFitScale(defScale);
        }
      } catch (err) {
        console.error('[PdfEditor] Error loading PDF:', err);
        toast?.error?.('Failed to load PDF document');
      } finally {
        setLoading(false);
      }
    };

    fetchPdfBuffer();
  }, [isOpen, fileId]);

  // Calculate automatic fit scale ('page' = fit whole page, 'width' = fit page width)
  const calculateFitScale = useCallback(
    async (targetFit = 'page', docInstance = null) => {
      const doc = docInstance || pdfDoc;
      if (!doc || !containerRef.current) return;

      try {
        const page = await doc.getPage(pageNum || 1);
        const pageMod = pageModifications[pageNum] || {};
        const userRot = pageMod.rotation || 0;
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation: userRot });

        const container = containerRef.current;
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
        const paddingX = isMobile ? 16 : 48;
        const paddingY = isMobile ? 16 : 48;

        const availW = Math.max(200, container.clientWidth - paddingX);
        const availH = Math.max(200, container.clientHeight - paddingY);

        let targetScale;
        if (targetFit === 'width') {
          targetScale = availW / unscaledViewport.width;
        } else {
          const scaleW = availW / unscaledViewport.width;
          const scaleH = availH / unscaledViewport.height;
          targetScale = Math.min(scaleW, scaleH);
        }

        const clampedScale = Math.max(0.35, Math.min(2.5, Number(targetScale.toFixed(2))));
        setScale(clampedScale);
        if (targetFit === 'page') {
          setBaseFitScale(clampedScale);
        }
        return clampedScale;
      } catch (err) {
        console.warn('[PdfEditor] calculateFitScale error:', err);
      }
    },
    [pdfDoc, pageNum, pageModifications]
  );

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

  const selectedElement = (annotationsByPage[pageNum] || []).find(
    (el) => el.id === selectedElementId
  );

  // Automatic Text Style Detection from underlying PDF & canvas pixels
  const detectTextStyleAtPosition = async (targetEl) => {
    if (!pdfDoc) {
      toast?.error?.('PDF document is still loading');
      return null;
    }
    if (!targetEl) return null;

    setIsDetectingStyle(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const pageMod = pageModifications[pageNum] || {};
      const userRot = pageMod.rotation || 0;
      const viewport = page.getViewport({ scale, rotation: userRot });

      // 1. Get text content stream from PDF.js
      const textContent = await page.getTextContent({ normalizeWhitespace: true });
      const items = textContent?.items || [];

      // Target element bounding box
      const elLeft = targetEl.x;
      const elTop = targetEl.y;
      const elWidth = targetEl.width || Math.max(60, (String(targetEl.text || '').length || 5) * 10);
      const elHeight = targetEl.height || (targetEl.fontSize || 18) * 1.5;
      const elRight = elLeft + elWidth;
      const elBottom = elTop + elHeight;
      const elCenterX = elLeft + elWidth / 2;
      const elCenterY = elTop + elHeight / 2;

      let bestMatch = null;
      let maxOverlap = 0;
      let minDistance = Infinity;

      for (const item of items) {
        if (!item.str || !item.str.trim()) continue;

        // Convert item baseline position to viewport canvas coordinates
        const [vx, vy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        const itemFontHeight = Math.hypot(item.transform[2], item.transform[3]) * scale || (item.height * scale) || 16;
        const itemFontWidth = (item.width || item.str.length * 8) * scale;

        // In PDF viewport coords, vy is the baseline. Glyph top is ~vy - itemFontHeight * 0.85
        const itemLeft = vx;
        const itemTop = vy - itemFontHeight * 0.85;
        const itemRight = vx + itemFontWidth;
        const itemBottom = vy + itemFontHeight * 0.25;

        // Check box overlap
        const overlapX = Math.max(0, Math.min(elRight, itemRight) - Math.max(elLeft, itemLeft));
        const overlapY = Math.max(0, Math.min(elBottom, itemBottom) - Math.max(elTop, itemTop));
        const overlapArea = overlapX * overlapY;

        const itemCenterX = (itemLeft + itemRight) / 2;
        const itemCenterY = (itemTop + itemBottom) / 2;
        const dist = Math.hypot(elCenterX - itemCenterX, elCenterY - itemCenterY);

        if (overlapArea > maxOverlap) {
          maxOverlap = overlapArea;
          bestMatch = { item, fontHeight: itemFontHeight, itemLeft, itemTop, itemFontWidth };
        } else if (maxOverlap === 0 && dist < minDistance && dist < 120) {
          minDistance = dist;
          bestMatch = { item, fontHeight: itemFontHeight, itemLeft, itemTop, itemFontWidth };
        }
      }

      let detectedFontId = 'helvetica';
      let detectedFontSize = targetEl.fontSize || 18;
      let detectedBold = false;
      let detectedItalic = false;
      let detectedColor = '#000000';
      let detectedText = '';

      if (bestMatch) {
        const { item, fontHeight } = bestMatch;
        detectedText = item.str.trim();

        // 1. Classify Font Family
        const styleObj = textContent.styles?.[item.fontName] || {};
        detectedFontId = classifyPdfFont(item.fontName, styleObj.fontFamily || '');

        // 2. Detect Bold & Italic
        detectedBold = isFontNameBold(item.fontName) || Boolean(styleObj.bold);
        detectedItalic = isFontNameItalic(item.fontName) || Boolean(styleObj.italic);

        // 3. Exact Font Size (matched to canvas pixels)
        detectedFontSize = Math.max(8, Math.min(72, Math.round(fontHeight)));
      }

      // 4. Sample true ink color from rendered canvas
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          const pixelRatio = window.devicePixelRatio || 1;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const sX = Math.max(0, Math.floor((bestMatch ? bestMatch.itemLeft : elLeft) * pixelRatio));
          const sY = Math.max(0, Math.floor((bestMatch ? bestMatch.itemTop : elTop) * pixelRatio));
          const sW = Math.min(canvas.width - sX, Math.max(10, Math.floor((bestMatch ? bestMatch.itemFontWidth : elWidth) * pixelRatio)));
          const sH = Math.min(canvas.height - sY, Math.max(10, Math.floor((bestMatch ? bestMatch.fontHeight : elHeight) * pixelRatio)));

          if (sW > 0 && sH > 0) {
            const imgData = ctx.getImageData(sX, sY, sW, sH);
            const data = imgData.data;

            let rSum = 0, gSum = 0, bSum = 0, inkCount = 0;
            let minBrightness = 255;
            let darkestR = 0, darkestG = 0, darkestB = 0;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              if (a < 100) continue;

              const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
              if (brightness < minBrightness) {
                minBrightness = brightness;
                darkestR = r;
                darkestG = g;
                darkestB = b;
              }

              if (brightness < 200) {
                rSum += r;
                gSum += g;
                bSum += b;
                inkCount++;
              }
            }

            if (inkCount > 4) {
              const avgR = Math.round(rSum / inkCount);
              const avgG = Math.round(gSum / inkCount);
              const avgB = Math.round(bSum / inkCount);
              detectedColor = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;
            } else if (minBrightness < 220) {
              detectedColor = `#${((1 << 24) + (darkestR << 16) + (darkestG << 8) + darkestB).toString(16).slice(1)}`;
            }
          }
        }
      } catch (colErr) {
        console.warn('[AutoDetect] Canvas pixel color sampling fallback:', colErr);
      }

      // Apply detected styles
      const updates = {
        fontFamily: detectedFontId,
        fontSize: detectedFontSize,
        bold: detectedBold,
        italic: detectedItalic,
        color: detectedColor,
      };

      if (detectedText && (!targetEl.text || targetEl.text === 'Sample Text')) {
        updates.text = detectedText;
      }

      updateElement(targetEl.id, updates);

      // Synchronize active toolbar states
      setActiveFontFamily(detectedFontId);
      setActiveFontSize(detectedFontSize);
      setActiveTextBold(detectedBold);
      setActiveTextItalic(detectedItalic);
      setActiveColor(detectedColor);

      const fontLabel = FONT_MAP[detectedFontId]?.name || detectedFontId;
      toast?.success?.(
        `✨ Auto-detected: ${fontLabel}, ${detectedFontSize}px, ${detectedBold ? 'Bold' : 'Regular'}${detectedItalic ? ' Italic' : ''}, ${detectedColor}`
      );

      return updates;
    } catch (err) {
      console.error('[PdfEditor] Auto-detect text style error:', err);
      toast?.error?.('Could not auto-detect text style at position');
      return null;
    } finally {
      setIsDetectingStyle(false);
    }
  };

  // Global Keyboard Shortcuts (Adobe Acrobat Pro Workflow)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea';

      // Escape: deselect element or stop inline editing
      if (e.key === 'Escape') {
        if (editingTextId) setEditingTextId(null);
        else if (selectedElementId) setSelectedElementId(null);
        return;
      }

      // If user is actively typing in an input or textarea, don't trigger tool or delete shortcuts
      if (isInputActive) return;

      // Delete / Backspace: Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        if (selectedElement) {
          e.preventDefault();
          duplicateElement(selectedElement);
          return;
        }
      }

      // Quick Tool Shortcuts (only when no modifier keys are pressed)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'v' || e.key === 'V') setActiveTool('select');
        else if (e.key === 't' || e.key === 'T') setActiveTool('text');
        else if (e.key === 'b' || e.key === 'B') setActiveTool('block');
        else if (e.key === 'p' || e.key === 'P') setActiveTool('pen');
        else if (e.key === 'h' || e.key === 'H') setActiveTool('highlighter');
        else if (e.key === 'r' || e.key === 'R') setActiveTool('redact');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedElementId, editingTextId, selectedElement, historyIndex, history.length]);

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
      const newEl = {
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
        strikethrough: activeTextStrikethrough,
        textAlign: activeTextAlign || 'left',
        backgroundColor: 'transparent',
      };
      const id = addElementToCurrentPage(newEl);
      setSelectedElementId(id);
      setEditingTextId(id);
      isInteractingRef.current = false;

      // Auto-detect style from underlying document text if available
      detectTextStyleAtPosition({ id, ...newEl });
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
    } else if (activeTool === 'redact' || activeTool === 'block') {
      redrawOverlay();
      const ctx = overlayCanvasRef.current.getContext('2d');
      const startX = interactionStartRef.current.x;
      const startY = interactionStartRef.current.y;
      const w = x - startX;
      const h = y - startY;

      ctx.save();
      if (activeTool === 'redact') {
        ctx.fillStyle = activeRedactColor || '#000000';
        ctx.globalAlpha = 0.55;
        ctx.fillRect(startX, startY, w, h);
        ctx.strokeStyle = '#EF4444';
        ctx.setLineDash([4, 2]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, startY, w, h);
      } else if (activeTool === 'block') {
        ctx.fillStyle = activeColor;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(startX, startY, w, h);
        ctx.strokeStyle = '#6366F1';
        ctx.setLineDash([4, 2]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX, startY, w, h);
      }
      ctx.restore();
    }
  };

  const handleOverlayMouseUp = (e) => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    redrawOverlay();
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
    } else if (activeTool === 'redact') {
      const finalW = width > 5 ? width : 130;
      const finalH = height > 5 ? height : 24;
      const finalX = width > 5 ? originX : Math.max(0, endX - 65);
      const finalY = width > 5 ? originY : Math.max(0, endY - 12);

      const newId = addElementToCurrentPage({
        type: 'redact',
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH,
        color: activeRedactColor || '#000000',
      });
      setSelectedElementId(newId);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 select-none animate-fade-in">
      {/* ========================================================= */}
      {/* TOP HEADER (TIER 1) - FULLY RESPONSIVE                    */}
      {/* ========================================================= */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 flex items-center justify-between gap-2 bg-white dark:bg-[#0F172A] shrink-0">
        {/* Left: Document Info & Page Manager Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showThumbnails
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
            }`}
            title="Toggle Page Thumbnails"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-mono text-slate-700 dark:text-slate-300">
              {numPages}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block" />

          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-900/50">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h3
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[95px] xs:max-w-[140px] sm:max-w-xs"
              title={fileName}
            >
              {fileName}
            </h3>
          </div>
        </div>

        {/* Center: Page Controls, Zoom (Desktop), and Undo/Redo */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Page navigation */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 px-1.5 select-none">
              {pageNum} <span className="text-slate-400 font-normal">/</span> {numPages}
            </span>
            <button
              onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
              disabled={pageNum >= numPages}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Desktop Zoom controls */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => {
                const nextRatio = Math.max(0.3, (scale / (baseFitScale || 1)) - 0.15);
                setScale(Number(((baseFitScale || 1) * nextRatio).toFixed(2)));
              }}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Quick Zoom Presets Dropdown */}
            <select
              value={
                [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].some(v => Math.abs((scale / (baseFitScale || 1)) - v) < 0.06)
                  ? String([0.5, 0.75, 1.0, 1.25, 1.5, 2.0].find(v => Math.abs((scale / (baseFitScale || 1)) - v) < 0.06))
                  : 'custom'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'fit-page') calculateFitScale('page');
                else if (val === 'fit-width') calculateFitScale('width');
                else {
                  const mult = parseFloat(val);
                  setScale(Number(((baseFitScale || 1) * mult).toFixed(2)));
                }
              }}
              className="bg-transparent text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 px-1 hover:text-indigo-600 transition cursor-pointer border-0 focus:outline-none"
              title="Zoom Level (Click to change or select Fit Page)"
            >
              <option value="custom" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                {Math.round((scale / (baseFitScale || 1)) * 100)}%
              </option>
              <option value="fit-page" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                Fit Page (100%)
              </option>
              <option value="fit-width" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                Fit Width
              </option>
              <option value="0.5" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">50%</option>
              <option value="0.75" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">75%</option>
              <option value="1.0" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">100% (Fit)</option>
              <option value="1.25" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">125%</option>
              <option value="1.5" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">150%</option>
              <option value="2.0" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">200%</option>
            </select>

            <button
              onClick={() => {
                const nextRatio = Math.min(3.0, (scale / (baseFitScale || 1)) + 0.15);
                setScale(Number(((baseFitScale || 1) * nextRatio).toFixed(2)));
              }}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            {/* One-click Fit Page */}
            <button
              onClick={() => calculateFitScale('page')}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Fit Full Page to Screen (100%)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-0.5" />

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer transition text-slate-700 dark:text-slate-300"
              title="Redo (Ctrl+Y)"
            >
              <RedoIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Export Actions & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rotate & Delete Page (Desktop) */}
          <button
            onClick={() => handleRotatePage(pageNum)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer hidden lg:flex items-center gap-1.5 text-xs font-medium"
            title="Rotate Current Page 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate</span>
          </button>

          <button
            onClick={() => handleDeletePage(pageNum)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer hidden lg:flex items-center gap-1.5 text-xs font-medium"
            title="Delete Current Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />

          {/* Download PDF Binary */}
          <button
            disabled={isCompiling}
            onClick={() => handleCompileAndExport('download')}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download compiled PDF binary"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Save to Cloud */}
          <button
            disabled={isCompiling}
            onClick={() => handleCompileAndExport('cloud')}
            className="px-2.5 sm:px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden xs:inline">Compiling...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xs:inline">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Save</span>
                <span className="hidden md:inline">to Cloud</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close Editor"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* SECONDARY TOOLBAR: TWO-SUB-ROW CONTEXTUAL ARCHITECTURE     */}
      {/* SUB-ROW 1: Primary Tools Bar (Smooth Horizontal Scroll)   */}
      {/* SUB-ROW 2: Contextual Property Inspector (Always Visible) */}
      {/* ========================================================= */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shrink-0 text-xs">
        {/* SUB-ROW 1: Primary Tools */}
        <div className="h-11 px-2 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0B1120]">
          {/* Select Tool (V) */}
          <button
            onClick={() => setActiveTool('select')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeTool === 'select'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Select</span>
          </button>

          {/* Add Text Tool (T) */}
          <button
            onClick={() => {
              setActiveTool('text');
              setSelectedElementId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeTool === 'text'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Add Text to PDF (T)"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>

          {/* Color Block Tool (B) */}
          <button
            onClick={() => {
              setActiveTool('block');
              setSelectedElementId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeTool === 'block'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Add Block of Any Color (B)"
          >
            <div
              className="w-3.5 h-3.5 rounded-xs border border-slate-400 dark:border-slate-500 shadow-2xs"
              style={{ backgroundColor: activeColor }}
            />
            <span>Block</span>
          </button>

          {/* Redact Censorship Tool (R) */}
          <button
            onClick={() => {
              setActiveTool('redact');
              setSelectedElementId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeTool === 'redact'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Redact / Censor Sensitive Data (R)"
          >
            <div
              className={`w-3.5 h-3.5 rounded-xs border ${
                activeRedactColor === '#FFFFFF' ? 'border-slate-400' : 'border-transparent'
              }`}
              style={{ backgroundColor: activeRedactColor || '#000000' }}
            />
            <span className="font-semibold">Redact</span>
          </button>

          {/* Freehand Pen Tool (P) */}
          <button
            onClick={() => {
              setActiveTool('pen');
              setSelectedElementId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeTool === 'pen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Draw Freehand Ink (P)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          {/* Highlighter Tool (H) */}
          <button
            onClick={() => {
              setActiveTool('highlighter');
              setSelectedElementId(null);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeTool === 'highlighter'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Highlight Lines (H)"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span>Highlight</span>
          </button>

          {/* Digital Signature Modal Trigger */}
          <button
            onClick={() => setShowSignatureModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition cursor-pointer shrink-0"
            title="Insert Digital Signature"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Sign</span>
          </button>

          {/* Stamps Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowStampsDropdown(!showStampsDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
              title="Add Business Stamp"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>Stamp</span>
            </button>

            {showStampsDropdown && (
              <div className="absolute top-10 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 w-44 space-y-1 animate-fade-in">
                {BUSINESS_STAMPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      handlePlaceStamp(s);
                      setShowStampsDropdown(false);
                    }}
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

        {/* SUB-ROW 2: Contextual Property Inspector Strip (Always Directly Visible on All Screens) */}
        <div className="min-h-[42px] px-2 sm:px-4 py-1 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-[#0F172A]">
          {/* --- CASE 1: REDACT PROPERTIES (Active Tool = Redact OR Selected Element = Redact) --- */}
          {(activeTool === 'redact' || selectedElement?.type === 'redact') && (
            <div className="flex items-center gap-2 flex-wrap shrink-0 animate-fade-in">
              <div className="flex items-center gap-1.5 bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl p-1 text-[11px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-1 shrink-0">
                  Redaction Color
                </span>

                {/* Preset Color Swatches: Blackout, Whiteout, Charcoal, Red */}
                <div className="flex items-center gap-1">
                  {[
                    { color: '#000000', label: 'Blackout' },
                    { color: '#FFFFFF', label: 'Whiteout' },
                    { color: '#334155', label: 'Charcoal' },
                    { color: '#DC2626', label: 'Confidential Red' },
                  ].map((item) => {
                    const currentC = selectedElement?.color || activeRedactColor;
                    const isCurrent = currentC.toLowerCase() === item.color.toLowerCase();
                    return (
                      <button
                        key={item.color}
                        onClick={() => {
                          setActiveRedactColor(item.color);
                          if (selectedElement && selectedElement.type === 'redact') {
                            updateElement(selectedElement.id, { color: item.color });
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xs ring-1.5 ring-indigo-500 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        title={item.label}
                      >
                        <span
                          className={`w-3 h-3 rounded-xs shrink-0 ${
                            item.color === '#FFFFFF' ? 'border border-slate-300 dark:border-slate-600' : ''
                          }`}
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="h-4 w-px bg-rose-200 dark:bg-rose-800 mx-0.5" />

                {/* Custom Color Spectrum Picker */}
                <label
                  className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer hover:border-indigo-400 transition"
                  title="Pick Custom Redaction Color"
                >
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span
                    className="w-3 h-3 rounded-xs border border-slate-400 shrink-0"
                    style={{ backgroundColor: selectedElement?.color || activeRedactColor }}
                  />
                  <input
                    type="color"
                    value={selectedElement?.color || activeRedactColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveRedactColor(val);
                      if (selectedElement && selectedElement.type === 'redact') {
                        updateElement(selectedElement.id, { color: val });
                      }
                    }}
                    className="w-0 h-0 opacity-0 absolute pointer-events-none"
                  />
                  <span className="text-[10px] font-mono uppercase text-slate-700 dark:text-slate-300 font-bold hidden sm:inline">
                    {selectedElement?.color || activeRedactColor}
                  </span>
                </label>

                {/* Actions if a redact box is selected */}
                {selectedElement && selectedElement.type === 'redact' && (
                  <>
                    <div className="h-4 w-px bg-rose-200 dark:bg-rose-800 mx-0.5" />
                    <button
                      onClick={() => duplicateElement(selectedElement)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                      title="Duplicate Redaction (Ctrl+D)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteElement(selectedElement.id)}
                      className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 cursor-pointer"
                      title="Delete Redaction (Del)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xl:inline">
                💡 Drag to censor or click anywhere to drop standard redact box
              </span>
            </div>
          )}

          {/* --- CASE 2: TEXT PROPERTIES (Active Tool = Text OR Selected Element = Text) --- */}
          {(activeTool === 'text' || selectedElement?.type === 'text') && (
            <div className="flex items-center gap-1.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-1 text-[11px] shrink-0 animate-fade-in flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 px-1 hidden sm:inline">
                Text
              </span>

              {/* Auto-Detect Text Style Button */}
              <button
                onClick={() => {
                  if (selectedElement?.type === 'text') {
                    detectTextStyleAtPosition(selectedElement);
                  } else {
                    toast?.info?.('Click on text in the document or select a text box to auto-detect its style');
                  }
                }}
                disabled={isDetectingStyle}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition cursor-pointer text-[10px] shadow-2xs ${
                  isDetectingStyle
                    ? 'bg-amber-500 text-slate-900 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white'
                }`}
                title="Auto-Detect Font, Size, Weight, and Ink Color from underlying document"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>{isDetectingStyle ? 'Detecting...' : 'Auto-Detect Style'}</span>
              </button>

              <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-800/80 mx-0.5" />

              {/* Font Family selector (Categorized) */}
              <select
                value={selectedElement?.fontFamily || activeFontFamily}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'auto') {
                    if (selectedElement) detectTextStyleAtPosition(selectedElement);
                  } else {
                    setActiveFontFamily(val);
                    if (selectedElement) updateElement(selectedElement.id, { fontFamily: val });
                  }
                }}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none max-w-[130px] sm:max-w-[150px]"
                title="Font Family"
              >
                <option value="auto">✨ Auto-Detect Font</option>
                {FONT_CATEGORIES.map((cat) => (
                  <optgroup key={cat.name} label={cat.name}>
                    {cat.fonts.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Font Size stepper */}
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5">
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
                <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-1 min-w-[20px] text-center">
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
                className={`p-1.5 rounded-lg transition cursor-pointer font-black ${
                  (selectedElement ? selectedElement.bold : activeTextBold)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              {/* Italic (I) */}
              <button
                onClick={() => {
                  const currentItalic = selectedElement ? selectedElement.italic : activeTextItalic;
                  const nextItalic = !currentItalic;
                  setActiveTextItalic(nextItalic);
                  if (selectedElement) updateElement(selectedElement.id, { italic: nextItalic });
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer italic ${
                  (selectedElement ? selectedElement.italic : activeTextItalic)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              {/* Underline (U) */}
              <button
                onClick={() => {
                  const currentUnderline = selectedElement ? selectedElement.underline : activeTextUnderline;
                  const nextUnderline = !currentUnderline;
                  setActiveTextUnderline(nextUnderline);
                  if (selectedElement) updateElement(selectedElement.id, { underline: nextUnderline });
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer underline ${
                  (selectedElement ? selectedElement.underline : activeTextUnderline)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              {/* Strikethrough (S) */}
              <button
                onClick={() => {
                  const currentStrikethrough = selectedElement ? selectedElement.strikethrough : activeTextStrikethrough;
                  const nextStrikethrough = !currentStrikethrough;
                  setActiveTextStrikethrough(nextStrikethrough);
                  if (selectedElement) updateElement(selectedElement.id, { strikethrough: nextStrikethrough });
                }}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  (selectedElement ? selectedElement.strikethrough : activeTextStrikethrough)
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Strikethrough"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>

              {/* Text Alignment */}
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                {[
                  { id: 'left', icon: AlignLeft, title: 'Align Left' },
                  { id: 'center', icon: AlignCenter, title: 'Align Center' },
                  { id: 'right', icon: AlignRight, title: 'Align Right' },
                ].map((item) => {
                  const currAlign = selectedElement?.textAlign || activeTextAlign || 'left';
                  const isActive = currAlign === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTextAlign(item.id);
                        if (selectedElement) updateElement(selectedElement.id, { textAlign: item.id });
                      }}
                      className={`p-1 rounded transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={item.title}
                    >
                      <Icon className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-800/80 mx-0.5" />

              {/* Text Color Picker */}
              <label
                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer hover:border-indigo-400 transition"
                title="Text Color"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
                  style={{ backgroundColor: selectedElement?.color || activeColor }}
                />
                <input
                  type="color"
                  value={selectedElement?.color || activeColor}
                  onChange={(e) => {
                    const c = e.target.value;
                    setActiveColor(c);
                    if (selectedElement) updateElement(selectedElement.id, { color: c });
                  }}
                  className="w-0 h-0 opacity-0 absolute pointer-events-none"
                />
                <span className="text-[10px] font-mono uppercase text-slate-700 dark:text-slate-300 font-bold hidden sm:inline">
                  {selectedElement?.color || activeColor}
                </span>
              </label>

              {/* Quick Text Swatches */}
              <div className="flex items-center gap-1 pl-1">
                {['#000000', '#2563EB', '#DC2626', '#16A34A', '#9333EA'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setActiveColor(c);
                      if (selectedElement) updateElement(selectedElement.id, { color: c });
                    }}
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              {selectedElement && (
                <>
                  <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-800/80 mx-0.5" />
                  <button
                    onClick={() => duplicateElement(selectedElement)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Duplicate Text (Ctrl+D)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 cursor-pointer"
                    title="Delete Text (Del)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* --- CASE 3: BLOCK PROPERTIES (Active Tool = Block OR Selected Element = Block) --- */}
          {(activeTool === 'block' || selectedElement?.type === 'block') && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-1 text-[11px] shrink-0 animate-fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 hidden sm:inline">
                Block
              </span>

              {/* Color spectrum picker */}
              <label
                className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer hover:border-indigo-400 transition"
                title="Pick Block Color"
              >
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span
                  className="w-3.5 h-3.5 rounded-xs border border-slate-400 shadow-2xs"
                  style={{ backgroundColor: selectedElement?.color || activeColor }}
                />
                <input
                  type="color"
                  value={selectedElement?.color || activeColor}
                  onChange={(e) => {
                    const c = e.target.value;
                    setActiveColor(c);
                    if (selectedElement) updateElement(selectedElement.id, { color: c });
                  }}
                  className="w-0 h-0 opacity-0 absolute pointer-events-none"
                />
                <span className="text-[10px] font-mono uppercase text-slate-700 dark:text-slate-300 font-bold hidden sm:inline">
                  {selectedElement?.color || activeColor}
                </span>
              </label>

              {/* Block Swatches */}
              <div className="flex items-center gap-1">
                {['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#000000', '#FFFFFF'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setActiveColor(c);
                      if (selectedElement) updateElement(selectedElement.id, { color: c });
                    }}
                    className={`w-4 h-4 rounded border transition cursor-pointer ${
                      (selectedElement?.color || activeColor) === c
                        ? 'ring-2 ring-indigo-500 scale-110 shadow-xs'
                        : 'border-slate-300 dark:border-slate-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* Opacity presets */}
              <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 px-1 font-medium hidden md:inline text-[10px]">Opacity:</span>
                {[1, 0.75, 0.5, 0.25].map((op) => {
                  const currentOp = selectedElement?.opacity !== undefined ? selectedElement.opacity : activeBlockOpacity;
                  return (
                    <button
                      key={op}
                      onClick={() => {
                        setActiveBlockOpacity(op);
                        if (selectedElement) updateElement(selectedElement.id, { opacity: op });
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        currentOp === op
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={`Opacity ${Math.round(op * 100)}%`}
                    >
                      {Math.round(op * 100)}%
                    </button>
                  );
                })}
              </div>

              {selectedElement && (
                <>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
                  <button
                    onClick={() => duplicateElement(selectedElement)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Duplicate Block (Ctrl+D)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 cursor-pointer"
                    title="Delete Block (Del)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* --- CASE 4: PEN / DRAW PROPERTIES --- */}
          {activeTool === 'pen' && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-1 text-[11px] shrink-0 animate-fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 hidden sm:inline">
                Pen
              </span>

              {/* Stroke Color Picker */}
              <label
                className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 cursor-pointer"
                title="Pick Pen Color"
              >
                <span className="w-3 h-3 rounded-full border border-slate-400 shadow-2xs" style={{ backgroundColor: activeColor }} />
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="w-0 h-0 opacity-0 absolute pointer-events-none"
                />
                <span className="text-[10px] font-mono uppercase text-slate-700 dark:text-slate-300 font-bold hidden sm:inline">
                  {activeColor}
                </span>
              </label>

              {/* Swatches */}
              <div className="flex items-center gap-1">
                {['#3B82F6', '#EF4444', '#10B981', '#000000', '#8B5CF6'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveColor(c)}
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* Stroke thickness */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                {[
                  { w: 2, label: 'Thin' },
                  { w: 4, label: 'Med' },
                  { w: 6, label: 'Thick' },
                ].map((item) => (
                  <button
                    key={item.w}
                    onClick={() => setActiveStrokeWidth(item.w)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      activeStrokeWidth === item.w
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- CASE 5: HIGHLIGHTER PROPERTIES --- */}
          {activeTool === 'highlighter' && (
            <div className="flex items-center gap-2 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-1 text-[11px] shrink-0 animate-fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-1">
                Highlighter
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Drag over text to highlight
              </span>
              <div className="flex items-center gap-1">
                {['#FACC15', '#4ADE80', '#38BDF8', '#F472B6', '#FB923C'].map((hc) => (
                  <div
                    key={hc}
                    className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-2xs"
                    style={{ backgroundColor: hc }}
                    title="Highlight tint"
                  />
                ))}
              </div>
            </div>
          )}

          {/* --- CASE 6: ANY OTHER SELECTED ELEMENT (SIGNATURE / STAMP) --- */}
          {selectedElement && !['text', 'block', 'redact'].includes(selectedElement.type) && (
            <div className="flex items-center gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1 text-[11px] shrink-0 animate-fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {selectedElement.type} Selected
              </span>
              <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-800 mx-0.5" />
              <button
                onClick={() => duplicateElement(selectedElement)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1 text-[10px]"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3 h-3" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => deleteElement(selectedElement.id)}
                className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 cursor-pointer flex items-center gap-1 text-[10px]"
                title="Delete (Del)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}

          {/* --- CASE 7: DEFAULT IDLE HINT --- */}
          {activeTool === 'select' && !selectedElement && (
            <div className="hidden md:flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px]">
              <span>💡 Click any element to edit or move • Shortcuts: V (Select), T (Text), B (Block), R (Redact), P (Pen), Del (Delete)</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* WORKSPACE: THUMBNAILS SIDEBAR/DRAWER + PDF CANVAS CANVAS  */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails Manager: Desktop Docked Sidebar */}
        {showThumbnails && (
          <aside className="hidden lg:flex w-48 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3 overflow-y-auto flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pages ({numPages})
              </span>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                title="Hide Pages"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
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

        {/* Mobile / Tablet Thumbnails Drawer Overlay (Never squashes canvas width) */}
        {showThumbnails && (
          <div className="lg:hidden fixed inset-0 z-[150] flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowThumbnails(false)}
            />
            {/* Slide-out Drawer */}
            <aside className="relative w-64 max-w-[80vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto flex flex-col gap-3 z-10 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Pages ({numPages})
                  </span>
                </div>
                <button
                  onClick={() => setShowThumbnails(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {Array.from({ length: numPages }).map((_, idx) => {
                  const p = idx + 1;
                  const isCurrent = pageNum === p;
                  const isDeleted = pageModifications[p]?.isDeleted;
                  return (
                    <div
                      key={p}
                      onClick={() => {
                        if (!isDeleted) {
                          setPageNum(p);
                          setShowThumbnails(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center gap-3 ${
                        isDeleted
                          ? 'opacity-30 line-through border-rose-500'
                          : isCurrent
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                        {p}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold">Page {p}</span>
                        <span className="text-[11px] text-slate-400">
                          {isCurrent ? 'Current page' : 'Tap to switch'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        )}

        {/* Central PDF Canvas Workspace (Smooth Centering & Non-clipping Scroll) */}
        <main
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-200/50 dark:bg-[#060911] relative"
        >
          {loading ? (
            <div className="min-w-full min-h-full flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-xs font-semibold text-slate-400">Loading high-resolution PDF canvas...</p>
              </div>
            </div>
          ) : (
            <div className="min-w-full min-h-full flex p-3 sm:p-6 md:p-8">
              <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white my-auto mx-auto shrink-0 transition-all duration-150">
              {/* Layer 1: PDF.js rendered page canvas */}
              <canvas ref={canvasRef} className="block select-none pointer-events-none" />

              {/* Layer 2: Interactive annotation overlay canvas (Pointer Events for Touch & Pen) */}
              <canvas
                ref={overlayCanvasRef}
                onPointerDown={handleOverlayMouseDown}
                onPointerMove={handleOverlayMouseMove}
                onPointerUp={handleOverlayMouseUp}
                className="absolute inset-0 cursor-crosshair touch-none"
              />

              {/* Layer 3: Rendered HTML Element Overlays (Text / Signatures / Stamps / Blocks / Redact) */}
              {(annotationsByPage[pageNum] || []).map((el) => {
                if (el.type === 'drawing' || el.type === 'highlight' || el.type === 'shape') {
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
                    {/* Redaction Element (Solid Opaque Censorship Box) */}
                    {el.type === 'redact' && (
                      <div
                        className="w-full h-full select-none"
                        style={{
                          backgroundColor: el.color || '#000000',
                        }}
                      />
                    )}

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
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              setEditingTextId(null);
                            } else if (e.key === 'Escape') {
                              setEditingTextId(null);
                            }
                          }}
                          style={{
                            color: el.color || '#000000',
                            fontSize: `${el.fontSize || 16}px`,
                            fontFamily: getCssFontFamily(el.fontFamily),
                            fontWeight: el.bold ? 'bold' : 'normal',
                            fontStyle: el.italic ? 'italic' : 'normal',
                            textDecoration: [
                              el.underline ? 'underline' : '',
                              el.strikethrough ? 'line-through' : '',
                            ].filter(Boolean).join(' ') || 'none',
                            textAlign: el.textAlign || 'left',
                            textTransform: el.textTransform || 'none',
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
                            fontFamily: getCssFontFamily(el.fontFamily),
                            fontWeight: el.bold ? 'bold' : 'normal',
                            fontStyle: el.italic ? 'italic' : 'normal',
                            textDecoration: [
                              el.underline ? 'underline' : '',
                              el.strikethrough ? 'line-through' : '',
                            ].filter(Boolean).join(' ') || 'none',
                            textAlign: el.textAlign || 'left',
                            textTransform: el.textTransform || 'none',
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
                        className={`no-drag absolute ${el.y < 42 ? '-bottom-9' : '-top-9'} left-0 flex items-center gap-1 bg-slate-900 text-white rounded-lg px-2 py-0.5 shadow-xl text-[10px] z-50 whitespace-nowrap animate-fade-in`}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        {/* Redact Element Options */}
                        {el.type === 'redact' && (
                          <>
                            <label className="flex items-center gap-1 cursor-pointer pr-1 border-r border-slate-700" title="Custom Redact Color">
                              <span className="w-3 h-3 rounded-xs border border-white/50" style={{ backgroundColor: el.color || '#000000' }} />
                              <input
                                type="color"
                                value={el.color || '#000000'}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  setActiveRedactColor(c);
                                  updateElement(el.id, { color: c });
                                }}
                                className="w-0 h-0 opacity-0 absolute pointer-events-none"
                              />
                            </label>
                            {[
                              { c: '#000000', label: 'Blackout' },
                              { c: '#FFFFFF', label: 'Whiteout' },
                              { c: '#334155', label: 'Charcoal' },
                              { c: '#DC2626', label: 'Red' },
                            ].map((item) => (
                              <button
                                key={item.c}
                                onClick={() => {
                                  setActiveRedactColor(item.c);
                                  updateElement(el.id, { color: item.c });
                                }}
                                className={`w-3.5 h-3.5 rounded-xs border transition cursor-pointer ${
                                  (el.color || '#000000').toLowerCase() === item.c.toLowerCase()
                                    ? 'ring-2 ring-indigo-400 scale-110'
                                    : 'border-slate-500 hover:scale-105'
                                }`}
                                style={{ backgroundColor: item.c }}
                                title={item.label}
                              />
                            ))}
                            <div className="h-2.5 w-px bg-slate-700 mx-0.5" />
                          </>
                        )}

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

                            {/* Auto-Detect Text Style from Document */}
                            <button
                              onClick={() => detectTextStyleAtPosition(el)}
                              disabled={isDetectingStyle}
                              className={`px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 font-semibold ${
                                isDetectingStyle
                                  ? 'bg-amber-500/30 text-amber-300 animate-pulse'
                                  : 'bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40'
                              }`}
                              title="Auto-Detect Text Style from Document (Font, Size, Weight, Color)"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span className="text-[9px]">Auto</span>
                            </button>

                            <div className="h-3 w-px bg-slate-700 mx-0.5" />

                            {/* Font Family selector (Categorized) */}
                            <select
                              value={el.fontFamily || 'helvetica'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'auto') {
                                  detectTextStyleAtPosition(el);
                                } else {
                                  updateElement(el.id, { fontFamily: val });
                                }
                              }}
                              className="bg-slate-800 text-slate-200 text-[10px] rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none cursor-pointer max-w-[105px]"
                              title="Font Family"
                            >
                              <option value="auto">✨ Auto-Detect</option>
                              {FONT_CATEGORIES.map((cat) => (
                                <optgroup key={cat.name} label={cat.name}>
                                  {cat.fonts.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.name}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
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

                            {/* Strikethrough (S) */}
                            <button
                              onClick={() => updateElement(el.id, { strikethrough: !el.strikethrough })}
                              className={`p-1 rounded transition cursor-pointer ${
                                el.strikethrough ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                              }`}
                              title="Strikethrough"
                            >
                              <Strikethrough className="w-3 h-3" />
                            </button>

                            {/* Text Alignment */}
                            <button
                              onClick={() => {
                                const nextAlign =
                                  el.textAlign === 'left' || !el.textAlign
                                    ? 'center'
                                    : el.textAlign === 'center'
                                    ? 'right'
                                    : 'left';
                                updateElement(el.id, { textAlign: nextAlign });
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                              title={`Align: ${el.textAlign || 'left'} (Click to cycle)`}
                            >
                              {el.textAlign === 'center' ? (
                                <AlignCenter className="w-3 h-3" />
                              ) : el.textAlign === 'right' ? (
                                <AlignRight className="w-3 h-3" />
                              ) : (
                                <AlignLeft className="w-3 h-3" />
                              )}
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

                    {/* 4 Corner Anchors & Resize Handle (Adobe Acrobat Style) */}
                    {isSelected && (
                      <>
                        <div className="no-drag absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-indigo-600 rounded-xs shadow-xs pointer-events-none" />
                        <div className="no-drag absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-indigo-600 rounded-xs shadow-xs pointer-events-none" />
                        <div className="no-drag absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-indigo-600 rounded-xs shadow-xs pointer-events-none" />
                        <div
                          onPointerDown={(e) => handleResizePointerDown(e, el)}
                          className="no-drag absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs cursor-se-resize shadow-md z-50 hover:scale-125 transition-transform"
                          title="Drag to resize"
                        />
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Floating Mobile / Tablet Zoom Pill at Bottom-Right */}
          <div className="md:hidden absolute bottom-4 right-4 z-40 flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200/80 dark:border-slate-700/80 p-1 text-xs">
            <button
              onClick={() => {
                const nextRatio = Math.max(0.3, (scale / (baseFitScale || 1)) - 0.15);
                setScale(Number(((baseFitScale || 1) * nextRatio).toFixed(2)));
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => calculateFitScale('page')}
              className="px-2 font-mono font-semibold text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer hover:text-indigo-600 transition"
              title="Fit to page (100%)"
            >
              {Math.round((scale / (baseFitScale || 1)) * 100)}%
            </button>
            <button
              onClick={() => {
                const nextRatio = Math.min(3.0, (scale / (baseFitScale || 1)) + 0.15);
                setScale(Number(((baseFitScale || 1) * nextRatio).toFixed(2)));
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
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
