import React, { useState, useEffect, useRef, useMemo } from 'react';
import FileCard from './FileCard';
import { useMarqueeSelection } from '../../../hooks/useMarqueeSelection';

// Responsive column breakpoints matching Tailwind CSS
const getColumnCount = (width) => {
  if (width < 640) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  if (width < 1280) return 4;
  if (width < 1536) return 5;
  return 6;
};

const ESTIMATED_ROW_HEIGHT = 180;
const OVERSCAN_ROWS = 3;

const VirtualizedFileGrid = ({
  files = [],
  searchQuery,
  onDelete,
  onPreview,
  onToggleStar,
  onToggleArchive,
  onShare,
  deletingId,
  starringId,
  archivingId,
  isTrashView,
  onRestore,
  restoringId,
  selectedFileIds,
  setSelectedFileIds,
  onToggleSelect,
  onExtract,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [containerTop, setContainerTop] = useState(0);

  // ━━ Advanced Marquee Selection with all pro features ━━
  const {
    isSelecting,
    selectionBox,
    selectedCount,
    handleMouseDown,
    handleShiftClick,
    trackLastClicked,
  } = useMarqueeSelection({
    containerRef,
    selectedFileIds,
    setSelectedFileIds,
    files,
    disabled: isTrashView,
  });

  // Enhanced toggle that supports Shift+Click range selection
  const handleEnhancedToggle = (e, fileId) => {
    if (e.shiftKey) {
      handleShiftClick(fileId);
      return;
    }
    trackLastClicked(fileId);
    if (onToggleSelect) onToggleSelect(e, fileId);
  };

  // Measure container width and resize responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth || window.innerWidth);
        const rect = containerRef.current.getBoundingClientRect();
        setContainerTop(rect.top + window.scrollY);
      }
      setViewportHeight(window.innerHeight);
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updateDimensions, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Optimized passive window scroll handler with RAF throttle
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollTop(window.scrollY);
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerTop(rect.top + window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const columnCount = useMemo(() => getColumnCount(containerWidth), [containerWidth]);
  const totalItems = files.length;
  const totalRows = Math.ceil(totalItems / columnCount);

  const shouldVirtualize = totalItems > 30;

  // Compute virtual slice of rows
  const { visibleFiles, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!shouldVirtualize || totalRows === 0) {
      return {
        visibleFiles: files,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const relativeScrollY = Math.max(0, scrollTop - containerTop);
    const startRowRaw = Math.floor(relativeScrollY / ESTIMATED_ROW_HEIGHT);
    const visibleRowCount = Math.ceil(viewportHeight / ESTIMATED_ROW_HEIGHT);

    const startRow = Math.max(0, startRowRaw - OVERSCAN_ROWS);
    const endRow = Math.min(totalRows, startRowRaw + visibleRowCount + OVERSCAN_ROWS);

    const startIndex = startRow * columnCount;
    const endIndex = Math.min(totalItems, endRow * columnCount);

    const topSpacer = startRow * ESTIMATED_ROW_HEIGHT;
    const bottomSpacer = Math.max(0, (totalRows - endRow) * ESTIMATED_ROW_HEIGHT);

    return {
      visibleFiles: files.slice(startIndex, endIndex),
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer,
    };
  }, [
    shouldVirtualize,
    files,
    totalItems,
    totalRows,
    scrollTop,
    containerTop,
    viewportHeight,
    columnCount,
  ]);

  if (totalItems === 0) return null;

  // ━━ Glassmorphic Marquee Selection Box ━━
  const renderMarqueeBox = () => {
    if (!isSelecting || !selectionBox) return null;
    return (
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          transform: `translate3d(${selectionBox.left}px, ${selectionBox.top}px, 0)`,
          width: `${selectionBox.width}px`,
          height: `${selectionBox.height}px`,
          willChange: 'transform, width, height',
          left: 0,
          top: 0,
        }}
      >
        {/* Outer glow layer */}
        <div
          className="absolute inset-0 rounded-xl opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.12) 50%, rgba(59,130,246,0.18) 100%)',
            boxShadow: '0 0 30px rgba(59,130,246,0.25), inset 0 0 20px rgba(59,130,246,0.08)',
          }}
        />
        {/* Inner crisp border */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            border: '1.5px solid rgba(59,130,246,0.7)',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
          }}
        />
        {/* Corner dots */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />

        {/* Floating counter badge */}
        {selectedCount > 0 && selectionBox.width > 50 && selectionBox.height > 30 && (
          <div
            className="absolute -top-8 right-0 flex items-center gap-1.5 px-3 py-1 rounded-full shadow-xl border border-blue-400/40"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
              animation: 'marquee-badge-pop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <span className="text-white text-[11px] font-black tracking-wider tabular-nums">
              {selectedCount}
            </span>
            <span className="text-blue-200 text-[10px] font-semibold">
              selected
            </span>
          </div>
        )}
      </div>
    );
  };

  // Direct render for small datasets
  if (!shouldVirtualize) {
    return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 stagger select-none relative"
      >
        {renderMarqueeBox()}

        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            searchQuery={searchQuery}
            onDelete={onDelete}
            onPreview={onPreview}
            onToggleStar={onToggleStar}
            onToggleArchive={onToggleArchive}
            onShare={onShare}
            deletingId={deletingId}
            starringId={starringId}
            archivingId={archivingId}
            isTrashView={isTrashView}
            onRestore={onRestore}
            restoringId={restoringId}
            isSelected={selectedFileIds ? selectedFileIds.has(file.id) : false}
            onToggleSelect={(e) => handleEnhancedToggle(e, file.id)}
            onExtract={onExtract}
            selectedFileIds={selectedFileIds}
          />
        ))}
      </div>
    );
  }

  // Virtualized high-performance grid
  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="w-full relative select-none"
    >
      {renderMarqueeBox()}

      {topSpacerHeight > 0 && (
        <div style={{ height: `${topSpacerHeight}px` }} aria-hidden="true" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
        {visibleFiles.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            searchQuery={searchQuery}
            onDelete={onDelete}
            onPreview={onPreview}
            onToggleStar={onToggleStar}
            onToggleArchive={onToggleArchive}
            onShare={onShare}
            deletingId={deletingId}
            starringId={starringId}
            archivingId={archivingId}
            isTrashView={isTrashView}
            onRestore={onRestore}
            restoringId={restoringId}
            isSelected={selectedFileIds ? selectedFileIds.has(file.id) : false}
            onToggleSelect={(e) => handleEnhancedToggle(e, file.id)}
            onExtract={onExtract}
            selectedFileIds={selectedFileIds}
          />
        ))}
      </div>

      {bottomSpacerHeight > 0 && (
        <div style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true" />
      )}
    </div>
  );
};

export default React.memo(VirtualizedFileGrid);
