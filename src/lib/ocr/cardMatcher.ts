/**
 * Card Template Matcher
 * Recognizes playing cards using template matching and color analysis
 */

import { Card, Rank, Suit, RANKS, SUITS } from '@/lib/poker/types';
import { CardOCRResult, CardTemplate, TemplateMatchResult } from './types';
import { getAverageColor, toGrayscale } from '@/lib/capture/frameProcessor';

// Card recognition colors
const SUIT_COLORS = {
  red: { r: 200, g: 50, b: 50 },    // Hearts, Diamonds
  black: { r: 30, g: 30, b: 30 },   // Spades, Clubs
  green: { r: 50, g: 150, b: 50 },  // Some sites use green for clubs
  blue: { r: 50, g: 100, b: 200 },  // Some sites use blue for diamonds
};

// Card background color (white/off-white)
const CARD_BACKGROUND = { r: 240, g: 240, b: 240 };

// Hidden card colors (typically blue/green pattern)
const HIDDEN_CARD_COLORS = [
  { r: 30, g: 60, b: 120 },  // Blue back
  { r: 80, g: 30, b: 30 },   // Red back
  { r: 20, g: 80, b: 50 },   // Green back
];

/**
 * Check if a region looks like a hidden card
 */
export function isHiddenCard(imageData: ImageData): boolean {
  const avg = getAverageColor(imageData);
  
  // Check if it matches any hidden card color
  for (const hiddenColor of HIDDEN_CARD_COLORS) {
    const colorDiff = Math.abs(avg.r - hiddenColor.r) +
                     Math.abs(avg.g - hiddenColor.g) +
                     Math.abs(avg.b - hiddenColor.b);
    if (colorDiff < 100) return true;
  }
  
  return false;
}

/**
 * Check if a region looks like a face-up card
 */
export function isFaceUpCard(imageData: ImageData): boolean {
  const avg = getAverageColor(imageData);
  
  // Card should have predominantly white/light background
  const isLight = avg.r > 180 && avg.g > 180 && avg.b > 180;
  
  return isLight;
}

/**
 * Detect suit from color
 */
export function detectSuitFromColor(imageData: ImageData): Suit | null {
  // Sample the center portion where suit symbol typically is
  const centerX = Math.floor(imageData.width * 0.3);
  const centerY = Math.floor(imageData.height * 0.4);
  const sampleWidth = Math.floor(imageData.width * 0.4);
  const sampleHeight = Math.floor(imageData.height * 0.3);
  
  let redCount = 0;
  let blackCount = 0;
  
  for (let y = centerY; y < centerY + sampleHeight; y++) {
    for (let x = centerX; x < centerX + sampleWidth; x++) {
      const idx = (y * imageData.width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      
      // Skip white/background pixels
      if (r > 200 && g > 200 && b > 200) continue;
      
      // Red detection (hearts/diamonds)
      if (r > 150 && g < 100 && b < 100) {
        redCount++;
      }
      // Black detection (spades/clubs)
      else if (r < 80 && g < 80 && b < 80) {
        blackCount++;
      }
    }
  }
  
  if (redCount > blackCount && redCount > 10) {
    // Could be hearts or diamonds - would need shape analysis to distinguish
    return 'hearts'; // Default to hearts for now
  } else if (blackCount > redCount && blackCount > 10) {
    // Could be spades or clubs
    return 'spades'; // Default to spades for now
  }
  
  return null;
}

/**
 * Simple perceptual hash for image comparison
 */
function computeHash(imageData: ImageData, size: number = 8): string {
  // Resize to small size
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // Put original image on temp canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw scaled
  ctx.drawImage(tempCanvas, 0, 0, size, size);
  const scaled = ctx.getImageData(0, 0, size, size);
  
  // Convert to grayscale and compute average
  let sum = 0;
  const grays: number[] = [];
  for (let i = 0; i < scaled.data.length; i += 4) {
    const gray = Math.round(
      scaled.data[i] * 0.299 + 
      scaled.data[i + 1] * 0.587 + 
      scaled.data[i + 2] * 0.114
    );
    grays.push(gray);
    sum += gray;
  }
  const avg = sum / grays.length;
  
  // Create binary hash
  let hash = '';
  for (const gray of grays) {
    hash += gray > avg ? '1' : '0';
  }
  
  return hash;
}

/**
 * Compare two hashes (Hamming distance)
 */
function compareHashes(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return 1;
  
  let diff = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) diff++;
  }
  
  return diff / hash1.length;
}

// Template storage
const cardTemplates: Map<string, CardTemplate> = new Map();

/**
 * Register a card template
 */
export function registerCardTemplate(
  rank: Rank,
  suit: Suit,
  imageData: ImageData
): void {
  const key = `${rank}${suit}`;
  const hash = computeHash(imageData);
  
  cardTemplates.set(key, {
    rank,
    suit,
    imageData,
    hash,
  });
}

/**
 * Match a card image against templates
 */
export function matchCardTemplate(imageData: ImageData): TemplateMatchResult {
  if (cardTemplates.size === 0) {
    return { rank: null, suit: null, confidence: 0, matchedTemplate: null };
  }
  
  const targetHash = computeHash(imageData);
  
  let bestMatch: CardTemplate | null = null;
  let bestScore = 1; // Lower is better (Hamming distance)
  
  for (const template of cardTemplates.values()) {
    if (!template.hash) continue;
    
    const score = compareHashes(targetHash, template.hash);
    if (score < bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }
  
  // Convert score to confidence (0-1, higher is better)
  const confidence = 1 - bestScore;
  
  if (bestMatch && confidence > 0.7) {
    return {
      rank: bestMatch.rank,
      suit: bestMatch.suit,
      confidence,
      matchedTemplate: bestMatch,
    };
  }
  
  return { rank: null, suit: null, confidence: 0, matchedTemplate: null };
}

/**
 * Recognize a card from an image region
 * Uses combination of template matching and color analysis
 */
export function recognizeCard(imageData: ImageData): CardOCRResult {
  const avgColor = getAverageColor(imageData);
  
  // Explicit logging of RGB values (not collapsed)
  console.log(`🔍 [CardMatcher] Card region: ${imageData.width}x${imageData.height}px, avgRGB=(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`);
  
  // Check what color this looks like
  const isGreenish = avgColor.g > avgColor.r && avgColor.g > avgColor.b;
  const isWhitish = avgColor.r > 180 && avgColor.g > 180 && avgColor.b > 180;
  const isDark = avgColor.r < 80 && avgColor.g < 80 && avgColor.b < 80;
  
  if (isGreenish && !isWhitish) {
    console.log('🔍 [CardMatcher] → Detected GREEN (likely table felt, not a card!)');
  } else if (isDark) {
    console.log('🔍 [CardMatcher] → Detected DARK region');
  } else if (isWhitish) {
    console.log('🔍 [CardMatcher] → Detected WHITE (possible card!)');
  }
  
  // Check if it's a hidden card
  if (isHiddenCard(imageData)) {
    console.log('🔍 [CardMatcher] → Hidden card detected (card back pattern)');
    return {
      card: null,
      confidence: 0.9,
      bbox: { x: 0, y: 0, width: imageData.width, height: imageData.height },
      isHidden: true,
    };
  }
  
  // Check if it looks like a card at all
  if (!isFaceUpCard(imageData)) {
    console.log(`🔍 [CardMatcher] → FAILED isFaceUpCard check (needs R>180, G>180, B>180, got ${avgColor.r}, ${avgColor.g}, ${avgColor.b})`);
    return {
      card: null,
      confidence: 0,
      bbox: { x: 0, y: 0, width: imageData.width, height: imageData.height },
      isHidden: false,
    };
  }
  
  console.log('🔍 [CardMatcher] → Looks like a face-up card, checking templates...');
  
  // Try template matching first
  const templateResult = matchCardTemplate(imageData);
  console.log('🔍 [CardMatcher] → Template match result:', templateResult);
  
  if (templateResult.rank && templateResult.suit && templateResult.confidence > 0.7) {
    return {
      card: { rank: templateResult.rank, suit: templateResult.suit },
      confidence: templateResult.confidence,
      bbox: { x: 0, y: 0, width: imageData.width, height: imageData.height },
      isHidden: false,
    };
  }
  
  // Fall back to color-based detection
  const detectedSuit = detectSuitFromColor(imageData);
  console.log('🔍 [CardMatcher] → Color-based suit detection:', detectedSuit);
  
  if (detectedSuit) {
    // We detected a suit but not the rank
    // Would need more sophisticated rank detection (OCR or template)
    console.log('🔍 [CardMatcher] → Detected suit color but no rank');
    return {
      card: null, // Can't determine full card without rank
      confidence: 0.5,
      bbox: { x: 0, y: 0, width: imageData.width, height: imageData.height },
      isHidden: false,
    };
  }
  
  console.log('🔍 [CardMatcher] → No card detected');
  return {
    card: null,
    confidence: 0,
    bbox: { x: 0, y: 0, width: imageData.width, height: imageData.height },
    isHidden: false,
  };
}

/**
 * Recognize multiple cards in a row (e.g., community cards)
 */
export function recognizeCardRow(
  imageData: ImageData,
  expectedCards: number,
  cardWidth: number,
  cardGap: number
): CardOCRResult[] {
  console.log('🃏 [CardMatcher] recognizeCardRow called:', {
    imageSize: `${imageData.width}x${imageData.height}`,
    expectedCards,
    cardWidth,
    cardGap,
  });
  
  const results: CardOCRResult[] = [];
  
  const totalWidth = expectedCards * cardWidth + (expectedCards - 1) * cardGap;
  const startX = Math.floor((imageData.width - totalWidth) / 2);
  
  console.log('🃏 [CardMatcher] Calculated positions:', { totalWidth, startX });
  
  for (let i = 0; i < expectedCards; i++) {
    const x = startX + i * (cardWidth + cardGap);
    
    // Crop the card region
    const cardData = cropCardRegion(imageData, x, cardWidth, imageData.height);
    
    if (cardData) {
      const result = recognizeCard(cardData);
      result.bbox.x += x;
      results.push(result);
      
      console.log(`🃏 [CardMatcher] Card ${i + 1}:`, {
        card: result.card ? `${result.card.rank}${result.card.suit[0]}` : null,
        isHidden: result.isHidden,
        confidence: result.confidence.toFixed(2),
      });
    } else {
      console.log(`🃏 [CardMatcher] Card ${i + 1}: Failed to crop (x=${x})`);
    }
  }
  
  return results;
}

/**
 * Helper to crop a card region
 */
function cropCardRegion(
  imageData: ImageData,
  x: number,
  width: number,
  height: number
): ImageData | null {
  if (x < 0 || x + width > imageData.width) return null;
  
  const croppedData = new Uint8ClampedArray(width * height * 4);
  
  for (let row = 0; row < height; row++) {
    const srcOffset = (row * imageData.width + x) * 4;
    const destOffset = row * width * 4;
    croppedData.set(
      imageData.data.slice(srcOffset, srcOffset + width * 4),
      destOffset
    );
  }
  
  return new ImageData(croppedData, width, height);
}

/**
 * Clear all templates
 */
export function clearTemplates(): void {
  cardTemplates.clear();
}

/**
 * Get template count
 */
export function getTemplateCount(): number {
  return cardTemplates.size;
}
