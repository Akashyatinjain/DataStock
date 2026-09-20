import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

/**
 * Converts a hex color string (#RRGGBB) to a pdf-lib rgb() color object (0..1 range)
 */
export function hexToPdfRgb(hex = '#000000') {
  if (!hex || typeof hex !== 'string') return rgb(0, 0, 0);
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length < 6) return rgb(0, 0, 0);

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  return rgb(
    isNaN(r) ? 0 : Math.max(0, Math.min(1, r)),
    isNaN(g) ? 0 : Math.max(0, Math.min(1, g)),
    isNaN(b) ? 0 : Math.max(0, Math.min(1, b))
  );
}

/**
 * Transforms canvas coordinates (top-left origin) to PDF page points (bottom-left origin)
 */
export function canvasToPdfCoordinates(canvasX, canvasY, elementWidth, elementHeight, canvasWidth, canvasHeight, page) {
  const pdfWidth = page.getWidth();
  const pdfHeight = page.getHeight();

  const scaleX = pdfWidth / (canvasWidth || 1);
  const scaleY = pdfHeight / (canvasHeight || 1);

  const x = canvasX * scaleX;
  const y = pdfHeight - (canvasY + elementHeight) * scaleY;
  const width = elementWidth * scaleX;
  const height = elementHeight * scaleY;

  return { x, y, width, height, scaleX, scaleY };
}

/**
 * Compiles modifications, annotations, signatures, text, and page manipulations
 * into a true, standard PDF binary format.
 *
 * @param {ArrayBuffer} sourcePdfBuffer - The raw PDF data
 * @param {Object} annotationsByPage - { [pageNum]: Array<AnnotationElement> }
 * @param {Object} pageModifications - { [pageNum]: { rotation: number, isDeleted: boolean } }
 * @returns {Promise<Uint8Array>} The compiled PDF bytes
 */
export async function compilePdfDocument(sourcePdfBuffer, annotationsByPage = {}, pageModifications = {}) {
  // Load original PDF document
  const pdfDoc = await PDFDocument.load(sourcePdfBuffer, {
    ignoreEncryption: true,
  });

  // Embed standard typography fonts (Helvetica, Times Roman, Courier with Bold & Italic variations)
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontHelveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const fontTimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontTimesRomanBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const fontCourierOblique = await pdfDoc.embedFont(StandardFonts.CourierOblique);
  const fontCourierBoldOblique = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

  const resolveFont = (family = 'helvetica', bold = false, italic = false) => {
    const f = String(family || '').toLowerCase();
    if (
      f.includes('times') ||
      f.includes('serif') ||
      f.includes('georgia') ||
      f.includes('garamond') ||
      f.includes('merriweather') ||
      f.includes('playfair') ||
      f.includes('cinzel')
    ) {
      if (bold && italic) return fontTimesRomanBoldItalic;
      if (bold) return fontTimesRomanBold;
      if (italic) return fontTimesRomanItalic;
      return fontTimesRoman;
    }
    if (
      f.includes('courier') ||
      f.includes('mono') ||
      f.includes('fira') ||
      f.includes('consolas') ||
      f.includes('code')
    ) {
      if (bold && italic) return fontCourierBoldOblique;
      if (bold) return fontCourierBold;
      if (italic) return fontCourierOblique;
      return fontCourier;
    }
    // Default: Helvetica / Sans / Display
    if (bold && italic) return fontHelveticaBoldOblique;
    if (bold) return fontHelveticaBold;
    if (italic) return fontHelveticaOblique;
    return fontHelvetica;
  };

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  // Process annotations page by page (1-indexed)
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageIndex = pageNum - 1;
    const page = pages[pageIndex];
    if (!page) continue;

    // 1. Apply page rotation modification if any
    const pageMod = pageModifications[pageNum];
    if (pageMod?.rotation) {
      const currentRot = page.getRotation().angle || 0;
      page.setRotation(degrees((currentRot + pageMod.rotation) % 360));
    }

    // 2. Draw annotations on this page
    const elements = annotationsByPage[pageNum] || [];

    for (const el of elements) {
      if (!el) continue;

      const { canvasWidth = 800, canvasHeight = 1100 } = el;
      const pdfWidth = page.getWidth();
      const pdfHeight = page.getHeight();
      const scaleX = pdfWidth / canvasWidth;
      const scaleY = pdfHeight / canvasHeight;

      // ── TEXT ELEMENT (Bold, Italic, Underline, Strikethrough, Alignment, Font Families, Color) ──
      if (el.type === 'text' && el.text) {
        const isScript = ['great-vibes', 'dancing-script', 'pacifico', 'caveat'].includes(el.fontFamily);
        let renderedAsScript = false;

        // For script & cursive fonts, render via offscreen high-DPI canvas to preserve calligraphy beauty in PDF
        if (isScript && typeof document !== 'undefined') {
          try {
            const dpr = 2;
            const canvas = document.createElement('canvas');
            const fontFamilies = {
              'great-vibes': "'Great Vibes', cursive",
              'dancing-script': "'Dancing Script', cursive",
              'pacifico': "'Pacifico', cursive",
              'caveat': "'Caveat', cursive",
            };
            const cssFont = fontFamilies[el.fontFamily] || 'cursive';
            const pxFontSize = Math.max(12, Math.round(el.fontSize || 18));
            const fontDesc = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${pxFontSize * dpr}px ${cssFont}`;

            const ctx = canvas.getContext('2d');
            ctx.font = fontDesc;
            const lines = String(el.text).split('\n');
            let maxW = 0;
            lines.forEach((l) => {
              const w = ctx.measureText(l).width;
              if (w > maxW) maxW = w;
            });
            const lineH = pxFontSize * 1.35 * dpr;
            canvas.width = Math.max(10, Math.ceil(maxW + 20 * dpr));
            canvas.height = Math.max(10, Math.ceil(lines.length * lineH + 10 * dpr));

            ctx.font = fontDesc;
            ctx.fillStyle = el.color || '#000000';
            ctx.textBaseline = 'top';

            lines.forEach((l, idx) => {
              let xOffset = 4 * dpr;
              const lw = ctx.measureText(l).width;
              if (el.textAlign === 'center') {
                xOffset = (canvas.width - lw) / 2;
              } else if (el.textAlign === 'right') {
                xOffset = canvas.width - lw - 4 * dpr;
              }
              const yOffset = idx * lineH + 4 * dpr;
              ctx.fillText(l, xOffset, yOffset);

              // Underline for script
              if (el.underline) {
                ctx.strokeStyle = el.color || '#000000';
                ctx.lineWidth = Math.max(1, 1.5 * dpr);
                ctx.beginPath();
                ctx.moveTo(xOffset, yOffset + pxFontSize * dpr);
                ctx.lineTo(xOffset + lw, yOffset + pxFontSize * dpr);
                ctx.stroke();
              }

              // Strikethrough for script
              if (el.strikethrough) {
                ctx.strokeStyle = el.color || '#000000';
                ctx.lineWidth = Math.max(1, 1.5 * dpr);
                ctx.beginPath();
                ctx.moveTo(xOffset, yOffset + (pxFontSize * dpr) / 2);
                ctx.lineTo(xOffset + lw, yOffset + (pxFontSize * dpr) / 2);
                ctx.stroke();
              }
            });

            const dataUrl = canvas.toDataURL('image/png');
            const embeddedImg = await pdfDoc.embedPng(dataUrl);
            const renderW = (canvas.width / dpr) * scaleX;
            const renderH = (canvas.height / dpr) * scaleY;

            page.drawImage(embeddedImg, {
              x: el.x * scaleX,
              y: pdfHeight - el.y * scaleY - renderH,
              width: renderW,
              height: renderH,
              opacity: 1,
            });
            renderedAsScript = true;
          } catch (scriptErr) {
            console.warn('[pdfCompiler] Script font canvas fallback to standard font:', scriptErr);
          }
        }

        if (renderedAsScript) continue;

        // Standard vector font rendering
        const fontSize = (el.fontSize || 16) * scaleY;
        const font = resolveFont(el.fontFamily, el.bold, el.italic);
        const color = hexToPdfRgb(el.color || '#000000');
        const pdfX = el.x * scaleX;
        const lineHeight = fontSize * 1.25;

        let textToRender = String(el.text);
        if (el.textTransform === 'uppercase') textToRender = textToRender.toUpperCase();
        else if (el.textTransform === 'lowercase') textToRender = textToRender.toLowerCase();

        const lines = textToRender.split('\n');
        const startPdfY = pdfHeight - el.y * scaleY - fontSize;

        // Draw background highlight / callout box if specified
        if (el.backgroundColor && el.backgroundColor !== 'transparent') {
          let maxLineWidth = 0;
          lines.forEach((line) => {
            try {
              const w = font.widthOfTextAtSize(line, fontSize);
              if (w > maxLineWidth) maxLineWidth = w;
            } catch (_) {}
          });
          const totalTextHeight = lines.length * lineHeight;
          page.drawRectangle({
            x: pdfX - 4,
            y: startPdfY - (lines.length - 1) * lineHeight - 2,
            width: maxLineWidth + 8,
            height: totalTextHeight + 4,
            color: hexToPdfRgb(el.backgroundColor),
            opacity: el.backgroundOpacity !== undefined ? el.backgroundOpacity : 1,
          });
        }

        // Draw each line of text
        lines.forEach((lineText, idx) => {
          let linePdfX = pdfX;
          let textWidth = 0;
          try {
            textWidth = font.widthOfTextAtSize(lineText, fontSize);
            const boxWidth = (el.width || 0) * scaleX;
            if (boxWidth > textWidth) {
              if (el.textAlign === 'center') {
                linePdfX = pdfX + (boxWidth - textWidth) / 2;
              } else if (el.textAlign === 'right') {
                linePdfX = pdfX + (boxWidth - textWidth);
              }
            }
          } catch (_) {}

          const lineY = startPdfY - idx * lineHeight;
          page.drawText(lineText, {
            x: linePdfX,
            y: lineY,
            size: fontSize,
            font,
            color,
          });

          // Underline formatting
          if (el.underline) {
            try {
              page.drawLine({
                start: { x: linePdfX, y: lineY - 2 },
                end: { x: linePdfX + textWidth, y: lineY - 2 },
                thickness: Math.max(1, fontSize * 0.07),
                color,
              });
            } catch (_) {}
          }

          // Strikethrough formatting
          if (el.strikethrough) {
            try {
              page.drawLine({
                start: { x: linePdfX, y: lineY + fontSize * 0.35 },
                end: { x: linePdfX + textWidth, y: lineY + fontSize * 0.35 },
                thickness: Math.max(1, fontSize * 0.07),
                color,
              });
            } catch (_) {}
          }
        });
      }

      // ── DIGITAL SIGNATURE OR IMAGE ELEMENT ──
      else if ((el.type === 'signature' || el.type === 'image' || el.type === 'stamp') && el.dataUrl) {
        try {
          let embeddedImage;
          if (el.dataUrl.startsWith('data:image/png')) {
            embeddedImage = await pdfDoc.embedPng(el.dataUrl);
          } else if (el.dataUrl.startsWith('data:image/jpeg') || el.dataUrl.startsWith('data:image/jpg')) {
            embeddedImage = await pdfDoc.embedJpg(el.dataUrl);
          }

          if (embeddedImage) {
            const coord = canvasToPdfCoordinates(
              el.x,
              el.y,
              el.width || 120,
              el.height || 60,
              canvasWidth,
              canvasHeight,
              page
            );

            page.drawImage(embeddedImage, {
              x: coord.x,
              y: coord.y,
              width: coord.width,
              height: coord.height,
              opacity: el.opacity || 1,
            });
          }
        } catch (imgErr) {
          console.warn('[pdfCompiler] Error embedding signature/image:', imgErr.message);
        }
      }

      // ── HIGHLIGHT ELEMENT (Semi-transparent rectangle) ──
      else if (el.type === 'highlight') {
        const coord = canvasToPdfCoordinates(
          el.x,
          el.y,
          el.width || 100,
          el.height || 20,
          canvasWidth,
          canvasHeight,
          page
        );

        page.drawRectangle({
          x: coord.x,
          y: coord.y,
          width: coord.width,
          height: coord.height,
          color: hexToPdfRgb(el.color || '#FACC15'),
          opacity: el.opacity || 0.4,
        });
      }

      // ── REDACTION ELEMENT (Solid Censorship Box) ──
      else if (el.type === 'redact') {
        const coord = canvasToPdfCoordinates(
          el.x,
          el.y,
          el.width || 100,
          el.height || 25,
          canvasWidth,
          canvasHeight,
          page
        );

        page.drawRectangle({
          x: coord.x,
          y: coord.y,
          width: coord.width,
          height: coord.height,
          color: hexToPdfRgb(el.color || '#000000'),
          opacity: 1,
        });
      }

      // ── COLOR BLOCK / FILLED BOX ELEMENT (ANY COLOR) ──
      else if (el.type === 'block') {
        const coord = canvasToPdfCoordinates(
          el.x,
          el.y,
          el.width || 140,
          el.height || 60,
          canvasWidth,
          canvasHeight,
          page
        );

        page.drawRectangle({
          x: coord.x,
          y: coord.y,
          width: coord.width,
          height: coord.height,
          color: hexToPdfRgb(el.color || '#3B82F6'),
          borderColor: el.borderColor ? hexToPdfRgb(el.borderColor) : undefined,
          borderWidth: el.borderWidth ? el.borderWidth * scaleX : 0,
          opacity: el.opacity !== undefined ? el.opacity : 1,
        });
      }

      // ── SHAPES: RECTANGLE, CIRCLE, LINE, ARROW ──
      else if (el.type === 'shape') {
        const strokeColor = hexToPdfRgb(el.strokeColor || '#2563EB');
        const lineWidth = (el.strokeWidth || 2) * scaleX;

        if (el.shapeType === 'rectangle') {
          const coord = canvasToPdfCoordinates(
            el.x,
            el.y,
            el.width || 100,
            el.height || 60,
            canvasWidth,
            canvasHeight,
            page
          );

          page.drawRectangle({
            x: coord.x,
            y: coord.y,
            width: coord.width,
            height: coord.height,
            borderColor: strokeColor,
            borderWidth: lineWidth,
            color: el.fillColor ? hexToPdfRgb(el.fillColor) : undefined,
            opacity: el.opacity || 1,
          });
        } else if (el.shapeType === 'circle') {
          const coord = canvasToPdfCoordinates(
            el.x,
            el.y,
            el.width || 60,
            el.height || 60,
            canvasWidth,
            canvasHeight,
            page
          );

          const radius = Math.min(coord.width, coord.height) / 2;
          page.drawEllipse({
            x: coord.x + radius,
            y: coord.y + radius,
            xScale: radius,
            yScale: radius,
            borderColor: strokeColor,
            borderWidth: lineWidth,
            color: el.fillColor ? hexToPdfRgb(el.fillColor) : undefined,
            opacity: el.opacity || 1,
          });
        } else if (el.shapeType === 'line' || el.shapeType === 'arrow') {
          const startX = el.x * scaleX;
          const startY = pdfHeight - el.y * scaleY;
          const endX = (el.x + (el.width || 50)) * scaleX;
          const endY = pdfHeight - (el.y + (el.height || 50)) * scaleY;

          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness: lineWidth,
            color: strokeColor,
          });
        }
      }

      // ── FREEHAND INK / DRAWING PATH ──
      else if (el.type === 'drawing' && Array.isArray(el.points) && el.points.length > 1) {
        const strokeColor = hexToPdfRgb(el.color || '#000000');
        const thickness = (el.strokeWidth || 2) * scaleX;

        for (let i = 1; i < el.points.length; i++) {
          const p0 = el.points[i - 1];
          const p1 = el.points[i];

          page.drawLine({
            start: { x: p0.x * scaleX, y: pdfHeight - p0.y * scaleY },
            end: { x: p1.x * scaleX, y: pdfHeight - p1.y * scaleY },
            thickness,
            color: strokeColor,
          });
        }
      }
    }
  }

  // 3. Handle page deletions (from highest index to lowest index)
  for (let pageNum = totalPages; pageNum >= 1; pageNum--) {
    if (pageModifications[pageNum]?.isDeleted && pdfDoc.getPageCount() > 1) {
      pdfDoc.removePage(pageNum - 1);
    }
  }

  // Save compiled PDF bytes
  return await pdfDoc.save();
}
