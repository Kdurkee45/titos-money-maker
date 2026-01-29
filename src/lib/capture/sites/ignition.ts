/**
 * Ignition Casino Poker Site Configuration
 * 
 * Based on research of Ignition's poker interface:
 * - 6-max tables (Zone Poker) and 9-max tables (cash games)
 * - Anonymous tables - players shown as seat numbers only
 * - 5 table color themes: red, blue, green, orange, magenta
 * - 4 card design styles
 * - Racetrack or segmented table shape
 * - All-in percentage bars under cards
 * - Flat, modern UI design
 * 
 * CALIBRATION NOTES:
 * These coordinates are based on a 1920x1080 window capture.
 * You may need to adjust based on your actual window size.
 * Use the Debug Panel to see captured frames and calibrate regions.
 */

import { SiteConfig, RegionConfig } from '../types';

// Ignition uses a specific color palette
export const IGNITION_COLORS = {
  // Table felt colors (player selectable)
  felt: {
    green: { r: 35, g: 85, b: 55 },
    red: { r: 120, g: 35, b: 35 },
    blue: { r: 35, g: 55, b: 100 },
    orange: { r: 140, g: 70, b: 30 },
    magenta: { r: 100, g: 35, b: 80 },
  },
  // Card colors
  card: {
    white: { r: 255, g: 255, b: 255 },
    red: { r: 200, g: 30, b: 30 },      // Hearts/Diamonds
    black: { r: 20, g: 20, b: 20 },      // Spades/Clubs
  },
  // UI elements
  ui: {
    activePlayer: { r: 255, g: 215, b: 0 },  // Yellow highlight
    dealer: { r: 255, g: 255, b: 255 },       // White D button
    pot: { r: 255, g: 200, b: 50 },           // Gold pot text
  },
};

// Card template data for Ignition's default card design
// Each card has specific pixel patterns we can match
export const IGNITION_CARD_TEMPLATES = {
  // Rank patterns - relative positions of key pixels in the rank area
  ranks: {
    'A': { pattern: 'triangle-top', keyPoints: [[0.5, 0.2], [0.3, 0.8], [0.7, 0.8]] },
    'K': { pattern: 'vertical-diagonals', keyPoints: [[0.3, 0.2], [0.3, 0.8], [0.7, 0.5]] },
    'Q': { pattern: 'oval-tail', keyPoints: [[0.5, 0.3], [0.5, 0.7], [0.7, 0.9]] },
    'J': { pattern: 'hook-bottom', keyPoints: [[0.5, 0.2], [0.5, 0.6], [0.3, 0.8]] },
    'T': { pattern: 'cross-top', keyPoints: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.8]] },
    '9': { pattern: 'circle-stem', keyPoints: [[0.5, 0.3], [0.5, 0.7], [0.3, 0.6]] },
    '8': { pattern: 'double-circle', keyPoints: [[0.5, 0.25], [0.5, 0.75]] },
    '7': { pattern: 'angle', keyPoints: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.8]] },
    '6': { pattern: 'circle-stem-up', keyPoints: [[0.5, 0.7], [0.5, 0.3], [0.7, 0.4]] },
    '5': { pattern: 'half-circle', keyPoints: [[0.3, 0.2], [0.7, 0.2], [0.5, 0.8]] },
    '4': { pattern: 'triangle-down', keyPoints: [[0.3, 0.3], [0.7, 0.5], [0.7, 0.8]] },
    '3': { pattern: 'double-curve', keyPoints: [[0.3, 0.2], [0.7, 0.4], [0.7, 0.7]] },
    '2': { pattern: 's-curve', keyPoints: [[0.3, 0.2], [0.7, 0.5], [0.3, 0.8]] },
  },
  // Suit patterns - color and shape
  suits: {
    hearts: { color: 'red', shape: 'heart' },
    diamonds: { color: 'red', shape: 'diamond' },
    clubs: { color: 'black', shape: 'clover' },
    spades: { color: 'black', shape: 'spade' },
  },
};

/**
 * Region configuration for 6-max table (Zone Poker)
 * Coordinates assume 1920x1080 capture window
 */
const IGNITION_6MAX_REGIONS: RegionConfig = {
  // Pot display - center of table
  pot: {
    x: 0.42,
    y: 0.35,
    width: 0.16,
    height: 0.06,
  },
  
  // Community cards - 5 cards in center
  communityCards: [
    { x: 0.32, y: 0.42, width: 0.055, height: 0.12 },  // Card 1
    { x: 0.38, y: 0.42, width: 0.055, height: 0.12 },  // Card 2
    { x: 0.44, y: 0.42, width: 0.055, height: 0.12 },  // Card 3
    { x: 0.50, y: 0.42, width: 0.055, height: 0.12 },  // Card 4 (Turn)
    { x: 0.56, y: 0.42, width: 0.055, height: 0.12 },  // Card 5 (River)
  ],
  
  // Player seats for 6-max table (clockwise from bottom center)
  // Ignition uses anonymous seating, players shown as "Seat 1", "Seat 2", etc.
  players: [
    // Seat 1 - Bottom center (typically hero position)
    {
      seat: 1,
      name: { x: 0.42, y: 0.82, width: 0.16, height: 0.04 },
      stack: { x: 0.42, y: 0.86, width: 0.16, height: 0.04 },
      bet: { x: 0.42, y: 0.72, width: 0.10, height: 0.04 },
      cards: [
        { x: 0.44, y: 0.60, width: 0.05, height: 0.10 },
        { x: 0.50, y: 0.60, width: 0.05, height: 0.10 },
      ],
      isHero: true,
    },
    // Seat 2 - Bottom left
    {
      seat: 2,
      name: { x: 0.12, y: 0.72, width: 0.14, height: 0.04 },
      stack: { x: 0.12, y: 0.76, width: 0.14, height: 0.04 },
      bet: { x: 0.26, y: 0.62, width: 0.10, height: 0.04 },
      cards: [
        { x: 0.14, y: 0.54, width: 0.045, height: 0.09 },
        { x: 0.19, y: 0.54, width: 0.045, height: 0.09 },
      ],
    },
    // Seat 3 - Top left
    {
      seat: 3,
      name: { x: 0.12, y: 0.22, width: 0.14, height: 0.04 },
      stack: { x: 0.12, y: 0.26, width: 0.14, height: 0.04 },
      bet: { x: 0.26, y: 0.32, width: 0.10, height: 0.04 },
      cards: [
        { x: 0.14, y: 0.30, width: 0.045, height: 0.09 },
        { x: 0.19, y: 0.30, width: 0.045, height: 0.09 },
      ],
    },
    // Seat 4 - Top center
    {
      seat: 4,
      name: { x: 0.42, y: 0.08, width: 0.16, height: 0.04 },
      stack: { x: 0.42, y: 0.12, width: 0.16, height: 0.04 },
      bet: { x: 0.42, y: 0.22, width: 0.10, height: 0.04 },
      cards: [
        { x: 0.44, y: 0.16, width: 0.045, height: 0.09 },
        { x: 0.50, y: 0.16, width: 0.045, height: 0.09 },
      ],
    },
    // Seat 5 - Top right
    {
      seat: 5,
      name: { x: 0.74, y: 0.22, width: 0.14, height: 0.04 },
      stack: { x: 0.74, y: 0.26, width: 0.14, height: 0.04 },
      bet: { x: 0.64, y: 0.32, width: 0.10, height: 0.04 },
      cards: [
        { x: 0.76, y: 0.30, width: 0.045, height: 0.09 },
        { x: 0.81, y: 0.30, width: 0.045, height: 0.09 },
      ],
    },
    // Seat 6 - Bottom right
    {
      seat: 6,
      name: { x: 0.74, y: 0.72, width: 0.14, height: 0.04 },
      stack: { x: 0.74, y: 0.76, width: 0.14, height: 0.04 },
      bet: { x: 0.64, y: 0.62, width: 0.10, height: 0.04 },
      cards: [
        { x: 0.76, y: 0.54, width: 0.045, height: 0.09 },
        { x: 0.81, y: 0.54, width: 0.045, height: 0.09 },
      ],
    },
  ],
  
  // Dealer button region - moves around the table
  dealerButton: {
    x: 0.30,
    y: 0.30,
    width: 0.40,
    height: 0.40,
  },
  
  // Action buttons at bottom
  actionButtons: {
    fold: { x: 0.55, y: 0.92, width: 0.12, height: 0.06 },
    check: { x: 0.68, y: 0.92, width: 0.12, height: 0.06 },
    call: { x: 0.68, y: 0.92, width: 0.12, height: 0.06 },
    raise: { x: 0.81, y: 0.92, width: 0.12, height: 0.06 },
  },
};

/**
 * Main Ignition site configuration
 */
export const ignitionConfig: SiteConfig = {
  name: 'ignition',
  displayName: 'Ignition Casino',
  
  // URL patterns for detection
  urlPatterns: [
    'ignitioncasino.eu',
    'ignitioncasino.com',
  ],
  
  // Window title patterns
  windowTitlePatterns: [
    /Ignition.*Poker/i,
    /Zone.*Poker/i,
    /Hold'?em/i,
  ],
  
  // Default to 6-max (Zone Poker is most common)
  defaultTableSize: 6,
  
  // Supported table sizes
  supportedTableSizes: [6, 9],
  
  // Region configurations by table size
  regions: {
    6: IGNITION_6MAX_REGIONS,
    // 9-max would have different positions (TODO: add when needed)
  },
  
  // OCR settings tuned for Ignition's fonts
  ocrSettings: {
    // Ignition uses a clean sans-serif font
    fontFamily: 'sans-serif',
    // Stack sizes are displayed in white/yellow
    stackColor: { r: 255, g: 255, b: 255 },
    // Pot is displayed in gold/yellow
    potColor: { r: 255, g: 200, b: 50 },
    // Player bets in white
    betColor: { r: 255, g: 255, b: 255 },
    // Confidence threshold for text
    minConfidence: 0.6,
  },
  
  // Card recognition settings
  cardSettings: {
    // Card background is white
    backgroundColor: { r: 255, g: 255, b: 255 },
    // Hidden cards are blue/back pattern
    hiddenCardColor: { r: 30, g: 60, b: 120 },
    // Red suits
    redColor: { r: 200, g: 30, b: 30 },
    // Black suits
    blackColor: { r: 20, g: 20, b: 20 },
    // Tolerance for color matching
    colorTolerance: 40,
  },
  
  // Visual indicators
  indicators: {
    // Active player has yellow/gold highlight
    activePlayerColor: { r: 255, g: 215, b: 0 },
    // Folded players are dimmed
    foldedOpacity: 0.5,
    // Dealer button is white circle with "D"
    dealerButtonColor: { r: 255, g: 255, b: 255 },
  },
};

export default ignitionConfig;
