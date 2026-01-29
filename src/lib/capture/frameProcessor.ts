/**
 * Frame Processor
 * Processes captured frames to extract regions of interest
 */

import { Region, CapturedFrame, CroppedRegion, PokerSiteConfig } from './types';

/**
 * Crop a region from an image
 */
export function cropRegion(
  imageData: ImageData,
  region: Region,
  label: string
): CroppedRegion {
  // Ensure region is within bounds
  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const width = Math.min(region.width, imageData.width - x);
  const height = Math.min(region.height, imageData.height - y);

  // Create new ImageData for the cropped region
  const croppedData = new Uint8ClampedArray(width * height * 4);

  for (let row = 0; row < height; row++) {
    const srcOffset = ((y + row) * imageData.width + x) * 4;
    const destOffset = row * width * 4;
    croppedData.set(
      imageData.data.slice(srcOffset, srcOffset + width * 4),
      destOffset
    );
  }

  return {
    region: { x, y, width, height },
    imageData: new ImageData(croppedData, width, height),
    label,
  };
}

/**
 * Convert relative region (0-1) to absolute pixels
 */
export function relativeToAbsolute(
  region: Region,
  frameWidth: number,
  frameHeight: number
): Region {
  return {
    x: Math.floor(region.x * frameWidth),
    y: Math.floor(region.y * frameHeight),
    width: Math.floor(region.width * frameWidth),
    height: Math.floor(region.height * frameHeight),
  };
}

/**
 * Extract all regions of interest from a frame using site config
 */
export function extractRegions(
  frame: CapturedFrame,
  config: PokerSiteConfig
): CroppedRegion[] {
  const regions: CroppedRegion[] = [];
  const { width, height, imageData } = frame;

  // Community cards
  const communityCardsRegion = relativeToAbsolute(config.regions.communityCards, width, height);
  regions.push(cropRegion(imageData, communityCardsRegion, 'communityCards'));

  // Pot
  const potRegion = relativeToAbsolute(config.regions.pot, width, height);
  regions.push(cropRegion(imageData, potRegion, 'pot'));

  // Hero cards
  const heroCardsRegion = relativeToAbsolute(config.regions.heroCards, width, height);
  regions.push(cropRegion(imageData, heroCardsRegion, 'heroCards'));

  // Action buttons
  const actionButtonsRegion = relativeToAbsolute(config.regions.actionButtons, width, height);
  regions.push(cropRegion(imageData, actionButtonsRegion, 'actionButtons'));

  // Each player seat
  for (const playerRegion of config.regions.players) {
    const absRegion = relativeToAbsolute(playerRegion, width, height);
    regions.push(cropRegion(imageData, absRegion, `player_${playerRegion.seatNumber}`));

    // Player name
    const nameRegion = relativeToAbsolute(playerRegion.nameRegion, width, height);
    regions.push(cropRegion(imageData, nameRegion, `player_${playerRegion.seatNumber}_name`));

    // Player stack
    const stackRegion = relativeToAbsolute(playerRegion.stackRegion, width, height);
    regions.push(cropRegion(imageData, stackRegion, `player_${playerRegion.seatNumber}_stack`));

    // Player bet
    const betRegion = relativeToAbsolute(playerRegion.betRegion, width, height);
    regions.push(cropRegion(imageData, betRegion, `player_${playerRegion.seatNumber}_bet`));
  }

  return regions;
}

/**
 * Convert ImageData to base64 data URL
 */
export function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Convert ImageData to Blob
 */
export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });
}

/**
 * Resize ImageData
 */
export function resizeImageData(
  imageData: ImageData,
  newWidth: number,
  newHeight: number
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw original
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Failed to get canvas context');
  tempCtx.putImageData(imageData, 0, 0);

  // Resize
  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

  return ctx.getImageData(0, 0, newWidth, newHeight);
}

/**
 * Apply grayscale to ImageData
 */
export function toGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply threshold to create binary image
 */
export function applyThreshold(imageData: ImageData, threshold: number = 128): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i];
    const value = gray > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Invert colors
 */
export function invertColors(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Get average color of a region
 */
export function getAverageColor(imageData: ImageData): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  const pixelCount = imageData.data.length / 4;

  for (let i = 0; i < imageData.data.length; i += 4) {
    r += imageData.data[i];
    g += imageData.data[i + 1];
    b += imageData.data[i + 2];
  }

  return {
    r: Math.round(r / pixelCount),
    g: Math.round(g / pixelCount),
    b: Math.round(b / pixelCount),
  };
}

/**
 * Check if region matches a target color (within tolerance)
 */
export function matchesColor(
  imageData: ImageData,
  targetColor: { r: number; g: number; b: number },
  tolerance: number = 30
): boolean {
  const avg = getAverageColor(imageData);
  return (
    Math.abs(avg.r - targetColor.r) <= tolerance &&
    Math.abs(avg.g - targetColor.g) <= tolerance &&
    Math.abs(avg.b - targetColor.b) <= tolerance
  );
}
