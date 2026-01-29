/**
 * Tesseract.js OCR Wrapper
 * Text recognition for player names, stacks, pot sizes, etc.
 */

import Tesseract from 'tesseract.js';
import { TextOCRResult, OCREngineStatus } from './types';
import { imageDataToDataURL } from '@/lib/capture/frameProcessor';

// Singleton worker
let worker: Tesseract.Worker | null = null;
let isInitializing = false;
let initPromise: Promise<Tesseract.Worker> | null = null;

/**
 * Initialize Tesseract worker
 */
export async function initTesseract(): Promise<Tesseract.Worker> {
  if (worker) return worker;
  
  if (isInitializing && initPromise) {
    return initPromise;
  }
  
  isInitializing = true;
  
  initPromise = (async () => {
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        // Optional: log progress
        if (m.status === 'recognizing text') {
          // Progress update
        }
      },
    });
    
    // Set parameters for poker text (numbers, player names)
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-.$,',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    });
    
    isInitializing = false;
    return worker;
  })();
  
  return initPromise;
}

/**
 * Terminate the worker
 */
export async function terminateTesseract(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
    initPromise = null;
  }
}

/**
 * Recognize text in an image
 */
export async function recognizeText(
  imageData: ImageData,
  options: {
    singleLine?: boolean;
    numbersOnly?: boolean;
  } = {}
): Promise<TextOCRResult> {
  const w = await initTesseract();
  
  // Convert ImageData to data URL
  const dataUrl = imageDataToDataURL(imageData);
  
  // Set parameters based on options
  if (options.numbersOnly) {
    await w.setParameters({
      tessedit_char_whitelist: '0123456789.,$',
    });
  } else if (options.singleLine) {
    await w.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    });
  }
  
  const result = await w.recognize(dataUrl);
  
  // Reset parameters
  await w.setParameters({
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-.$,',
  });
  
  return {
    text: result.data.text.trim(),
    confidence: result.data.confidence / 100,
    bbox: {
      x: 0,
      y: 0,
      width: imageData.width,
      height: imageData.height,
    },
  };
}

/**
 * Parse a number from OCR text
 */
export function parseNumber(text: string): number | null {
  // Remove common OCR artifacts and format issues
  const cleaned = text
    .replace(/[^0-9.,]/g, '')
    .replace(/,/g, '')
    .trim();
  
  if (!cleaned) return null;
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a player name from OCR text
 */
export function parsePlayerName(text: string): string | null {
  const cleaned = text.trim();
  if (cleaned.length < 2 || cleaned.length > 20) return null;
  return cleaned;
}

/**
 * Recognize stack amount
 */
export async function recognizeStack(imageData: ImageData): Promise<number | null> {
  const result = await recognizeText(imageData, { numbersOnly: true });
  return parseNumber(result.text);
}

/**
 * Recognize pot amount
 */
export async function recognizePot(imageData: ImageData): Promise<number | null> {
  console.log('💰 [Tesseract] recognizePot called, image size:', `${imageData.width}x${imageData.height}`);
  const result = await recognizeText(imageData, { numbersOnly: true });
  console.log('💰 [Tesseract] Raw OCR result:', result.text, 'confidence:', result.confidence);
  const parsed = parseNumber(result.text);
  console.log('💰 [Tesseract] Parsed pot value:', parsed);
  return parsed;
}

/**
 * Recognize player name
 */
export async function recognizePlayerName(imageData: ImageData): Promise<string | null> {
  const result = await recognizeText(imageData, { singleLine: true });
  return parsePlayerName(result.text);
}

/**
 * Batch recognize multiple regions
 */
export async function batchRecognize(
  regions: { imageData: ImageData; label: string }[]
): Promise<Map<string, TextOCRResult>> {
  const results = new Map<string, TextOCRResult>();
  
  // Process in parallel with concurrency limit
  const concurrency = 3;
  for (let i = 0; i < regions.length; i += concurrency) {
    const batch = regions.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async ({ imageData, label }) => {
        const result = await recognizeText(imageData);
        return { label, result };
      })
    );
    
    for (const { label, result } of batchResults) {
      results.set(label, result);
    }
  }
  
  return results;
}

/**
 * Get OCR engine status
 */
export function getOCRStatus(): OCREngineStatus {
  return {
    initialized: worker !== null,
    loading: false,
    isReady: worker !== null,
    isProcessing: false, // Would need to track this
    progress: worker ? 1 : 0,
    error: null,
  };
}
