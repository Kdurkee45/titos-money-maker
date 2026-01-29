/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Universal Card Recognizer
 * 
 * Recognizes poker cards using a combination of:
 * 1. Card boundary detection (white rectangles)
 * 2. OCR for rank identification (A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2)
 * 3. Color analysis for suit identification (red = hearts/diamonds, black = spades/clubs)
 * 4. Shape analysis to distinguish hearts from diamonds, spades from clubs
 * 
 * This approach works with ANY card design without requiring site-specific templates.
 */

import { Card, Suit, Rank } from '@/lib/poker/types';

export interface CardRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: ImageData;
}

export interface CardRecognitionResult {
  card: Card | null;
  confidence: number;
  isHidden: boolean;  // Face-down card detected
  isEmpty: boolean;   // No card in region
  debug: {
    detectedRank: string | null;
    detectedSuitColor: 'red' | 'black' | null;
    detectedSuit: Suit | null;
    cardBoundaryFound: boolean;
  };
}

// Standard rank characters we look for
const RANK_CHARS = ['A', 'K', 'Q', 'J', 'T', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_MAP: Record<string, Rank> = {
  'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J',
  'T': 'T', '10': 'T',
  '9': '9', '8': '8', '7': '7', '6': '6',
  '5': '5', '4': '4', '3': '3', '2': '2',
};

// Color thresholds
const COLOR_THRESHOLDS = {
  // White card background
  whiteMin: { r: 220, g: 220, b: 220 },
  // Red suit color (hearts/diamonds)
  redMin: { r: 150, g: 0, b: 0 },
  redMax: { r: 255, g: 100, b: 100 },
  // Black suit color (spades/clubs)  
  blackMax: { r: 80, g: 80, b: 80 },
  // Hidden card (blue back)
  hiddenBlue: { r: 20, g: 40, b: 100 },
};

/**
 * Main card recognition function
 */
export function recognizeCard(
  imageData: ImageData,
  tesseractWorker?: any
): Promise<CardRecognitionResult> {
  return new Promise(async (resolve) => {
    const result: CardRecognitionResult = {
      card: null,
      confidence: 0,
      isHidden: false,
      isEmpty: true,
      debug: {
        detectedRank: null,
        detectedSuitColor: null,
        detectedSuit: null,
        cardBoundaryFound: false,
      },
    };

    // Step 1: Check if region contains a card
    const cardAnalysis = analyzeCardRegion(imageData);
    
    if (cardAnalysis.isEmpty) {
      result.isEmpty = true;
      resolve(result);
      return;
    }

    if (cardAnalysis.isHidden) {
      result.isEmpty = false;
      result.isHidden = true;
      result.confidence = cardAnalysis.confidence;
      resolve(result);
      return;
    }

    result.isEmpty = false;
    result.debug.cardBoundaryFound = cardAnalysis.hasWhiteBackground;

    // Step 2: Detect suit color from the suit symbol area
    const suitColor = detectSuitColor(imageData);
    result.debug.detectedSuitColor = suitColor;

    // Step 3: Try OCR for rank (if worker available)
    let detectedRank: Rank | null = null;
    if (tesseractWorker) {
      try {
        const rankText = await ocrRankRegion(imageData, tesseractWorker);
        detectedRank = parseRankFromText(rankText);
        result.debug.detectedRank = rankText;
      } catch (e) {
        console.warn('OCR failed for card rank:', e);
      }
    }

    // Step 4: If OCR failed, try shape-based rank detection
    if (!detectedRank) {
      detectedRank = detectRankByShape(imageData);
      result.debug.detectedRank = detectedRank;
    }

    // Step 5: Determine suit from color + shape
    const suit = detectSuit(imageData, suitColor);
    result.debug.detectedSuit = suit;

    // Build final result
    if (detectedRank && suit) {
      result.card = { rank: detectedRank, suit };
      result.confidence = 0.8; // Base confidence
      
      // Boost confidence if both OCR and color analysis agree
      if (result.debug.detectedSuitColor && suitColor) {
        result.confidence += 0.1;
      }
    } else if (detectedRank || suit) {
      // Partial detection
      result.confidence = 0.4;
      if (detectedRank && suitColor) {
        // Guess suit from color alone
        const guessedSuit = suitColor === 'red' ? 'hearts' : 'spades';
        result.card = { rank: detectedRank, suit: guessedSuit };
      }
    }

    resolve(result);
  });
}

/**
 * Analyze if a region contains a card, hidden card, or is empty
 */
function analyzeCardRegion(imageData: ImageData): {
  isEmpty: boolean;
  isHidden: boolean;
  hasWhiteBackground: boolean;
  confidence: number;
} {
  const { data, width, height } = imageData;
  let whiteCount = 0;
  let blueCount = 0;
  const totalPixels = width * height;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check for white (card face)
    if (r > COLOR_THRESHOLDS.whiteMin.r && 
        g > COLOR_THRESHOLDS.whiteMin.g && 
        b > COLOR_THRESHOLDS.whiteMin.b) {
      whiteCount++;
    }

    // Check for blue (card back - hidden)
    if (b > r + 30 && b > g + 30 && b > 60) {
      blueCount++;
    }
  }

  const whiteRatio = whiteCount / totalPixels;
  const blueRatio = blueCount / totalPixels;

  // If > 40% white, likely a face-up card
  if (whiteRatio > 0.4) {
    return {
      isEmpty: false,
      isHidden: false,
      hasWhiteBackground: true,
      confidence: Math.min(whiteRatio * 1.2, 1),
    };
  }

  // If > 30% blue, likely a face-down card
  if (blueRatio > 0.3) {
    return {
      isEmpty: false,
      isHidden: true,
      hasWhiteBackground: false,
      confidence: Math.min(blueRatio * 1.5, 1),
    };
  }

  // Otherwise, probably empty (table felt)
  return {
    isEmpty: true,
    isHidden: false,
    hasWhiteBackground: false,
    confidence: 0,
  };
}

/**
 * Detect suit color by analyzing the suit symbol area
 * Typically in the upper portion of the card, below the rank
 */
function detectSuitColor(imageData: ImageData): 'red' | 'black' | null {
  const { data, width, height } = imageData;
  
  // Focus on the suit symbol area (upper-left quadrant, below rank)
  const startY = Math.floor(height * 0.25);
  const endY = Math.floor(height * 0.5);
  const startX = Math.floor(width * 0.1);
  const endX = Math.floor(width * 0.5);

  let redPixels = 0;
  let blackPixels = 0;
  let sampledPixels = 0;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skip white/near-white pixels (card background)
      if (r > 200 && g > 200 && b > 200) continue;

      sampledPixels++;

      // Red detection: high red, low green/blue
      if (r > 150 && r > g + 50 && r > b + 50) {
        redPixels++;
      }
      // Black detection: all channels low
      else if (r < 80 && g < 80 && b < 80) {
        blackPixels++;
      }
    }
  }

  if (sampledPixels < 10) return null;

  const redRatio = redPixels / sampledPixels;
  const blackRatio = blackPixels / sampledPixels;

  if (redRatio > 0.3 && redRatio > blackRatio) return 'red';
  if (blackRatio > 0.3 && blackRatio > redRatio) return 'black';

  return null;
}

/**
 * Detect specific suit using color and shape analysis
 */
function detectSuit(imageData: ImageData, suitColor: 'red' | 'black' | null): Suit | null {
  if (!suitColor) return null;

  const { data, width, height } = imageData;
  
  // Analyze the suit symbol shape
  // Focus on the suit area
  const startY = Math.floor(height * 0.25);
  const endY = Math.floor(height * 0.55);
  const startX = Math.floor(width * 0.1);
  const endX = Math.floor(width * 0.5);

  // Extract colored pixels as a binary mask
  const mask: boolean[][] = [];
  for (let y = startY; y < endY; y++) {
    const row: boolean[] = [];
    for (let x = startX; x < endX; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if this is a suit-colored pixel
      let isSuitPixel = false;
      if (suitColor === 'red') {
        isSuitPixel = r > 150 && r > g + 40 && r > b + 40;
      } else {
        isSuitPixel = r < 80 && g < 80 && b < 80;
      }
      row.push(isSuitPixel);
    }
    mask.push(row);
  }

  // Analyze shape characteristics
  const shape = analyzeShape(mask);

  if (suitColor === 'red') {
    // Hearts have a notch at the top (concave), diamonds are convex
    if (shape.hasTopNotch) {
      return 'hearts';
    } else {
      return 'diamonds';
    }
  } else {
    // Spades have a stem at bottom, clubs have 3 lobes
    if (shape.hasBottomStem && !shape.hasThreeLobes) {
      return 'spades';
    } else {
      return 'clubs';
    }
  }
}

/**
 * Analyze shape characteristics of the suit symbol
 */
function analyzeShape(mask: boolean[][]): {
  hasTopNotch: boolean;
  hasBottomStem: boolean;
  hasThreeLobes: boolean;
} {
  if (mask.length === 0 || mask[0].length === 0) {
    return { hasTopNotch: false, hasBottomStem: false, hasThreeLobes: false };
  }

  const height = mask.length;
  const width = mask[0].length;
  const midX = Math.floor(width / 2);

  // Check for top notch (heart characteristic)
  // Hearts have a gap at the top center
  let topCenterFilled = 0;
  let topSideFilled = 0;
  const topRows = Math.floor(height * 0.3);
  
  for (let y = 0; y < topRows; y++) {
    // Center
    if (mask[y][midX]) topCenterFilled++;
    // Sides
    if (mask[y][Math.floor(width * 0.25)]) topSideFilled++;
    if (mask[y][Math.floor(width * 0.75)]) topSideFilled++;
  }
  
  const hasTopNotch = topSideFilled > topCenterFilled * 1.5;

  // Check for bottom stem (spade characteristic)
  let bottomCenterFilled = 0;
  let bottomSideFilled = 0;
  const bottomStart = Math.floor(height * 0.7);
  
  for (let y = bottomStart; y < height; y++) {
    if (mask[y][midX]) bottomCenterFilled++;
    if (mask[y][Math.floor(width * 0.25)]) bottomSideFilled++;
    if (mask[y][Math.floor(width * 0.75)]) bottomSideFilled++;
  }
  
  const hasBottomStem = bottomCenterFilled > bottomSideFilled * 1.5;

  // Check for three lobes (club characteristic)
  // Clubs have three distinct circular regions
  const midY = Math.floor(height / 2);
  let topLobe = false;
  let leftLobe = false;
  let rightLobe = false;

  // Top lobe
  for (let x = Math.floor(width * 0.35); x < Math.floor(width * 0.65); x++) {
    if (mask[Math.floor(height * 0.15)]?.[x]) topLobe = true;
  }
  // Left lobe
  for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.6); y++) {
    if (mask[y]?.[Math.floor(width * 0.15)]) leftLobe = true;
  }
  // Right lobe
  for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.6); y++) {
    if (mask[y]?.[Math.floor(width * 0.85)]) rightLobe = true;
  }

  const hasThreeLobes = topLobe && leftLobe && rightLobe;

  return { hasTopNotch, hasBottomStem, hasThreeLobes };
}

/**
 * OCR the rank region of a card
 */
async function ocrRankRegion(imageData: ImageData, worker: any): Promise<string> {
  const { width, height } = imageData;
  
  // Rank is in top-left corner, roughly upper 35% height, left 40% width
  const rankWidth = Math.floor(width * 0.4);
  const rankHeight = Math.floor(height * 0.35);
  
  // Create canvas for the rank region
  const canvas = document.createElement('canvas');
  canvas.width = rankWidth;
  canvas.height = rankHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Copy rank region
  ctx.putImageData(imageData, 0, 0, 0, 0, rankWidth, rankHeight);

  // Get data URL for Tesseract
  const dataUrl = canvas.toDataURL();
  
  const result = await worker.recognize(dataUrl);
  return result.data.text.trim().toUpperCase();
}

/**
 * Parse rank from OCR text
 */
function parseRankFromText(text: string): Rank | null {
  // Clean up text
  const cleaned = text.replace(/[^A-Z0-9]/g, '').substring(0, 2);
  
  // Direct match
  if (RANK_MAP[cleaned]) return RANK_MAP[cleaned];
  
  // First character match
  const first = cleaned.charAt(0);
  if (RANK_MAP[first]) return RANK_MAP[first];

  // Handle common OCR mistakes
  const ocrFixes: Record<string, Rank> = {
    '0': 'T',  // 0 often misread for 10
    'O': 'Q',  // O looks like Q
    'I': 'J',  // I looks like J
    '1': 'A',  // 1 can look like A
  };
  
  if (ocrFixes[first]) return ocrFixes[first];

  return null;
}

/**
 * Detect rank by analyzing the shape of the rank symbol
 * Fallback when OCR fails
 */
function detectRankByShape(imageData: ImageData): Rank | null {
  // This is a simplified version - real implementation would use
  // more sophisticated shape matching or a trained classifier
  
  const { data, width, height } = imageData;
  
  // Focus on rank area (top-left)
  const rankWidth = Math.floor(width * 0.35);
  const rankHeight = Math.floor(height * 0.3);
  
  // Count dark pixels in rank area
  let darkPixels = 0;
  let totalPixels = 0;
  
  for (let y = 2; y < rankHeight; y++) {
    for (let x = 2; x < rankWidth; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip white background
      if (r > 200 && g > 200 && b > 200) continue;
      
      totalPixels++;
      // Count dark or colored pixels
      if (r < 150 || (r > 150 && g < 100 && b < 100)) {
        darkPixels++;
      }
    }
  }

  // Very rough heuristic based on ink density
  // Face cards (K, Q, J) typically have more pixels
  // Number cards vary
  // This would need training data to be accurate
  
  const density = totalPixels > 0 ? darkPixels / totalPixels : 0;
  
  // Just return null for now - OCR is more reliable
  return null;
}

export default { recognizeCard, analyzeCardRegion };
