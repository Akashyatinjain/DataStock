import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Download,
  Loader2,
  AlertCircle,
  RotateCw,
  Columns,
  List
} from 'lucide-react';
import { authFetch, apiUrl } from '../../utils/auth';

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export default function PdfViewer({
  url,
  fileId,
  fileName,
  onDownload,
  annotationMode,
  annotations = [],
  onStartDrawing,
  onDraw,
  onStopDrawing,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renderMode, setRenderMode] = useState('single'); // 'single' or 'continuous'
  const [renderingPage, setRenderingPage] = useState(false);

  const canvasRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setPageNum(1);

    const loadPdfData = async () => {
      let pdfData = null;

      // 1. Try loading directly from URL
      try {
        if (url) {
          const loadingTask = pdfjsLib.getDocument({
            url,
            withCredentials: false,
          });
          const doc = await loadingTask.promise;
          if (!isCancelled) {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setLoading(false);
            return;
          }
        }
      } catch (directErr) {
        console.warn("Direct PDF.js URL fetch failed (likely CORS), attempting authenticated backend proxy...", directErr);
      }

      // 2. Fallback: Fetch via Backend Download Proxy
      if (fileId) {
        try {
          const res = await authFetch(apiUrl(`/files/${fileId}/download`));
          if (!res.ok) throw new Error("Failed to fetch PDF from backend proxy");
          const arrayBuffer = await res.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const doc = await loadingTask.promise;
          if (!isCancelled) {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setLoading(false);
            return;
          }
        } catch (proxyErr) {
          console.error("Backend proxy PDF loading failed:", proxyErr);
          if (!isCancelled) {
            setError("Could not load PDF document. You can open it in a new tab or download it directly.");
            setLoading(false);
          }
        }
      } else {
        if (!isCancelled) {
          setError("PDF document could not be rendered inline.");
          setLoading(false);
        }
      }
    };

    loadPdfData();

    return () => {
      isCancelled = true;
    };
  }, [url, fileId]);

  // Render single page on canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      setRenderingPage(true);
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Calculate mobile-friendly responsive scale
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const unscaledViewport = page.getViewport({ scale: 1, rotation });
      
      let computedScale = scale;
      // On mobile viewports (<640px), ensure PDF fits screen width nicely by default
      if (containerWidth < 640 && scale === 1.1) {
        computedScale = Math.max(0.6, (containerWidth - 32) / unscaledViewport.width);
      }

      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: computedScale, rotation });

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
      setRenderingPage(false);
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error("PDF page rendering error:", err);
      }
      setRenderingPage(false);
    }
  }, [pdfDoc, pageNum, scale, rotation]);

  useEffect(() => {
    if (pdfDoc && renderMode === 'single') {
      renderPage();
    }
  }, [pdfDoc, pageNum, scale, rotation, renderMode, renderPage]);

  // Annotation canvas rendering
  useEffect(() => {
    if (annotationCanvasRef.current && canvasRef.current && annotationMode) {
      const annCanvas = annotationCanvasRef.current;
      const mainCanvas = canvasRef.current;
      annCanvas.width = mainCanvas.width;
      annCanvas.height = mainCanvas.height;
      annCanvas.style.width = mainCanvas.style.width;
      annCanvas.style.height = mainCanvas.style.height;

      const ctx = annCanvas.getContext('2d');
      ctx.clearRect(0, 0, annCanvas.width, annCanvas.height);

      const pixelRatio = window.devicePixelRatio || 1;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      annotations.forEach((ann) => {
        if (!ann.points || ann.points.length === 0) return;
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      });
    }
  }, [annotations, annotationMode, renderingPage]);

  const handlePrevPage = () => {
    if (pageNum > 1) setPageNum(pageNum - 1);
  };

  const handleNextPage = () => {
    if (pageNum < numPages) setPageNum(pageNum + 1);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFitWidth = () => {
    if (pdfDoc && containerRef.current) {
      pdfDoc.getPage(pageNum).then((page) => {
        const vp = page.getViewport({ scale: 1, rotation });
        const cWidth = containerRef.current.clientWidth - 40;
        const newScale = cWidth / vp.width;
        setScale(Math.max(0.5, Math.min(newScale, 2.5)));
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0F172A] p-8 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Rendering PDF document...</p>
        <span className="text-[11px] text-gray-400">High-resolution mobile canvas engine</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0F172A] p-6 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl max-w-md">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Preview Note</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Full Browser
              </a>
            )}
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-[#0F172A] select-none" ref={containerRef}>
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs shadow-xs z-10">
        {/* Pagination */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5">
          <button
            onClick={handlePrevPage}
            disabled={pageNum <= 1}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 rounded text-gray-700 dark:text-gray-200 transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-[11px] text-gray-800 dark:text-gray-200 min-w-[4rem] text-center font-semibold">
            {pageNum} / {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNum >= numPages}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 rounded text-gray-700 dark:text-gray-200 transition"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-200 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-[2.8rem] text-center font-bold">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-200 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleFitWidth}
            className="p-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 transition hidden sm:flex items-center gap-1 text-[11px]"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit</span>
          </button>

          <button
            onClick={handleRotate}
            className="p-1.5 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 transition flex items-center gap-1 text-[11px]"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-1 text-[11px] shadow-xs"
              title="Open PDF in Full Native Viewer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Native</span>
            </a>
          )}
        </div>
      </div>

      {/* PDF Canvas Viewport Area */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex items-center justify-center relative touch-pan-x touch-pan-y">
        <div className="relative shadow-2xl rounded-lg bg-white overflow-hidden border border-gray-300 dark:border-slate-700">
          <canvas ref={canvasRef} className="block max-w-none" />

          {/* Annotation Overlay Canvas */}
          {annotationMode && (
            <canvas
              ref={annotationCanvasRef}
              onMouseDown={onStartDrawing}
              onMouseMove={onDraw}
              onMouseUp={onStopDrawing}
              onMouseLeave={onStopDrawing}
              onTouchStart={onStartDrawing}
              onTouchMove={onDraw}
              onTouchEnd={onStopDrawing}
              className="absolute inset-0 cursor-crosshair touch-none z-20"
            />
          )}
        </div>
      </div>
    </div>
  );
}
