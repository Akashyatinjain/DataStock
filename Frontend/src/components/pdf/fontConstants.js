/**
 * Central Typography and Font Styles Library for PDF Editor
 */

export const FONT_CATEGORIES = [
  {
    name: 'Sans-Serif',
    fonts: [
      { id: 'helvetica', name: 'Sans (Helvetica)', css: 'Helvetica, Arial, Inter, sans-serif', standard: 'helvetica' },
      { id: 'inter', name: 'Inter (Modern Sans)', css: "'Inter', sans-serif", standard: 'helvetica' },
      { id: 'roboto', name: 'Roboto', css: "'Roboto', sans-serif", standard: 'helvetica' },
      { id: 'poppins', name: 'Poppins', css: "'Poppins', sans-serif", standard: 'helvetica' },
      { id: 'open-sans', name: 'Open Sans', css: "'Open Sans', sans-serif", standard: 'helvetica' },
      { id: 'montserrat', name: 'Montserrat', css: "'Montserrat', sans-serif", standard: 'helvetica' },
      { id: 'arial', name: 'Arial', css: 'Arial, Helvetica, sans-serif', standard: 'helvetica' },
    ],
  },
  {
    name: 'Serif',
    fonts: [
      { id: 'times', name: 'Serif (Times)', css: "'Times New Roman', Times, Georgia, serif", standard: 'times' },
      { id: 'georgia', name: 'Georgia', css: 'Georgia, serif', standard: 'times' },
      { id: 'garamond', name: 'Garamond', css: "Garamond, 'EB Garamond', serif", standard: 'times' },
      { id: 'merriweather', name: 'Merriweather', css: "'Merriweather', serif", standard: 'times' },
      { id: 'playfair', name: 'Playfair Display', css: "'Playfair Display', serif", standard: 'times' },
    ],
  },
  {
    name: 'Monospace',
    fonts: [
      { id: 'courier', name: 'Mono (Courier)', css: "'Courier New', Courier, monospace", standard: 'courier' },
      { id: 'fira-code', name: 'Fira Code', css: "'Fira Code', monospace", standard: 'courier' },
      { id: 'roboto-mono', name: 'Roboto Mono', css: "'Roboto Mono', monospace", standard: 'courier' },
      { id: 'consolas', name: 'Consolas', css: 'Consolas, Monaco, monospace', standard: 'courier' },
    ],
  },
  {
    name: 'Script & Cursive',
    fonts: [
      { id: 'great-vibes', name: 'Great Vibes (Formal)', css: "'Great Vibes', cursive", isScript: true, standard: 'times' },
      { id: 'dancing-script', name: 'Dancing Script', css: "'Dancing Script', cursive", isScript: true, standard: 'times' },
      { id: 'pacifico', name: 'Pacifico (Brush)', css: "'Pacifico', cursive", isScript: true, standard: 'helvetica' },
      { id: 'caveat', name: 'Caveat (Handwritten)', css: "'Caveat', cursive", isScript: true, standard: 'helvetica' },
    ],
  },
  {
    name: 'Display',
    fonts: [
      { id: 'impact', name: 'Impact (Heavy)', css: "Impact, 'Arial Black', sans-serif", standard: 'helvetica' },
      { id: 'comic-neue', name: 'Comic Neue / Sans', css: "'Comic Neue', 'Comic Sans MS', cursive", standard: 'helvetica' },
      { id: 'cinzel', name: 'Cinzel (Roman Title)', css: "'Cinzel', serif", standard: 'times' },
    ],
  },
];

// Flat lookup map
export const FONT_MAP = {};
FONT_CATEGORIES.forEach((cat) => {
  cat.fonts.forEach((f) => {
    FONT_MAP[f.id] = { ...f, category: cat.name };
  });
});

/**
 * Get CSS font-family string for an element
 */
export function getCssFontFamily(fontId = 'helvetica') {
  return FONT_MAP[fontId]?.css || 'Helvetica, Arial, Inter, sans-serif';
}

/**
 * Check if font is script or handwriting font
 */
export function isScriptOrCustomFont(fontId = 'helvetica') {
  return Boolean(FONT_MAP[fontId]?.isScript);
}

/**
 * Get standard PDF font base ('helvetica' | 'times' | 'courier')
 */
export function getStandardFontFallback(fontId = 'helvetica') {
  return FONT_MAP[fontId]?.standard || 'helvetica';
}

/**
 * Intelligent classifier for raw PDF font names and style descriptions.
 * Analyzes PostScript font names, PDF.js family hints, and assigns best matching font.
 */
export function classifyPdfFont(rawFontName = '', pdfJsFamily = '') {
  const combined = `${rawFontName} ${pdfJsFamily}`.toLowerCase();

  // 1. Script / Cursive
  if (
    combined.includes('script') ||
    combined.includes('pacifico') ||
    combined.includes('dancing') ||
    combined.includes('greatvibes') ||
    combined.includes('brush') ||
    combined.includes('caveat') ||
    combined.includes('hand') ||
    combined.includes('cursive') ||
    combined.includes('calligraph')
  ) {
    if (combined.includes('dancing')) return 'dancing-script';
    if (combined.includes('pacifico')) return 'pacifico';
    if (combined.includes('caveat')) return 'caveat';
    return 'great-vibes';
  }

  // 2. Monospace
  if (
    combined.includes('courier') ||
    combined.includes('mono') ||
    combined.includes('consolas') ||
    combined.includes('fira') ||
    combined.includes('menlo') ||
    combined.includes('typewriter') ||
    pdfJsFamily.toLowerCase().includes('monospace')
  ) {
    if (combined.includes('fira')) return 'fira-code';
    if (combined.includes('consolas')) return 'consolas';
    if (combined.includes('roboto mono')) return 'roboto-mono';
    return 'courier';
  }

  // 3. Serif
  if (
    combined.includes('times') ||
    combined.includes('roman') ||
    combined.includes('georgia') ||
    combined.includes('garamond') ||
    combined.includes('merriweather') ||
    combined.includes('playfair') ||
    combined.includes('minion') ||
    combined.includes('baskerville') ||
    combined.includes('cambria') ||
    combined.includes('palatino') ||
    combined.includes('serif') ||
    pdfJsFamily.toLowerCase().includes('serif')
  ) {
    if (combined.includes('georgia')) return 'georgia';
    if (combined.includes('garamond')) return 'garamond';
    if (combined.includes('merriweather')) return 'merriweather';
    if (combined.includes('playfair')) return 'playfair';
    return 'times';
  }

  // 4. Display
  if (combined.includes('impact') || combined.includes('cinzel') || combined.includes('comic')) {
    if (combined.includes('impact')) return 'impact';
    if (combined.includes('cinzel')) return 'cinzel';
    return 'comic-neue';
  }

  // 5. Sans-Serif
  if (combined.includes('roboto')) return 'roboto';
  if (combined.includes('poppins')) return 'poppins';
  if (combined.includes('inter')) return 'inter';
  if (combined.includes('montserrat')) return 'montserrat';
  if (combined.includes('open sans') || combined.includes('opensans')) return 'open-sans';
  if (combined.includes('arial')) return 'arial';

  return 'helvetica';
}

/**
 * Detect font weight (bold) from PDF font name
 */
export function isFontNameBold(fontName = '') {
  const fn = fontName.toLowerCase();
  return (
    fn.includes('bold') ||
    fn.includes('black') ||
    fn.includes('heavy') ||
    fn.includes('semibold') ||
    fn.includes('demi') ||
    fn.includes('w7') ||
    fn.includes('w8') ||
    fn.includes('w9') ||
    fn.includes('700') ||
    fn.includes('800') ||
    fn.includes('900') ||
    fn.endsWith('-b') ||
    fn.endsWith('+b') ||
    fn.includes('-bd')
  );
}

/**
 * Detect font style (italic/oblique) from PDF font name
 */
export function isFontNameItalic(fontName = '') {
  const fn = fontName.toLowerCase();
  return (
    fn.includes('italic') ||
    fn.includes('oblique') ||
    fn.includes('slanted') ||
    fn.includes('inclined') ||
    fn.endsWith('-i') ||
    fn.endsWith('+i') ||
    fn.includes('-it')
  );
}
