import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FileCard from './FileCard';

// Responsive column breakpoints matching Tailwind CSS
const getColumnCount = (width) => {
  if (width < 640) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  if (width < 1280) return 4;
  if (width < 1536) return 5;
  return 6;
};

const ESTIMATED_ROW_HEIGHT = 180; // Estimated height per row in pixels (card + gap)
const OVERSCAN_ROWS = 3; // Extra rows rendered above and below viewport

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

  // If item count is small (<= 30), render normal grid with stagger animations
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

    // Relative scroll offset inside the grid container
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

  // Direct render for small datasets (preserves native smooth animations)
  if (!shouldVirtualize) {
    return (
      <div
        ref={containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 stagger"
      >
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
            onToggleSelect={(e) => onToggleSelect && onToggleSelect(e, file.id)}
            onExtract={onExtract}
            selectedFileIds={selectedFileIds}
          />
        ))}
      </div>
    );
  }

  // Virtualized high-performance grid
  return (
    <div ref={containerRef} className="w-full relative">
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
            onToggleSelect={(e) => onToggleSelect && onToggleSelect(e, file.id)}
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
