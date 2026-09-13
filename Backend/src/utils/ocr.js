import Tesseract from 'tesseract.js';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');


/**
 * Extracts text from a file (image or PDF) for indexing.
 * @param {string} filePath - Absolute path to the local temporary file
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string|null>} Extracted text or null
 */
export const extractText = async (filePath, mimetype) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  try {
    if (mimetype && mimetype.startsWith('image/')) {
      console.log(`[OCR] Running OCR on image: ${filePath}`);
      const result = await Tesseract.recognize(filePath, 'eng');
      const text = result?.data?.text;
      if (text) {
        // Clean up common OCR noise/extra whitespaces
        return text.replace(/\s+/g, ' ').trim();
      }
    } else if (mimetype === 'application/pdf') {
      console.log(`[OCR] Parsing text from PDF: ${filePath}`);
      const dataBuffer = fs.readFileSync(filePath);
      let text = null;

      if (typeof pdfParse === "function") {
        const data = await pdfParse(dataBuffer);
        text = data?.text;
      } else if (pdfParse?.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: dataBuffer });
        try {
          await parser.load();
          const result = await parser.getText();
          text = typeof result === "string" ? result : result?.text;
        } finally {
          if (typeof parser.destroy === "function") {
            await parser.destroy();
          }
        }
      }

      if (text) {
        return text.replace(/\s+/g, ' ').trim();
      }
    }
  } catch (error) {
    console.error(`[OCR] Error extracting text from ${filePath} of type ${mimetype}:`, error);
  }

  return null;
};
