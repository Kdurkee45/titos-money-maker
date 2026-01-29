/**
 * Screen Capture Types
 */

// Region definition for screen areas
export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Player region includes seat number
export interface PlayerRegion extends Region {
  seatNumber: number;
  nameRegion: Region;
  stackRegion: Region;
  cardsRegion: Region;
  betRegion: Region;
  actionRegion: Region;
}

// Poker site configuration
export interface PokerSiteConfig {
  name: string;
  displayName: string;
  
  // Window detection
  windowTitlePattern: RegExp;
  
  // Table detection
  tableDetection: {
    backgroundColors: string[]; // Hex colors to look for
    minWidth: number;
    minHeight: number;
  };
  
  // Region definitions (relative to table bounds, 0-1)
  regions: {
    communityCards: Region;
    pot: Region;
    heroCards: Region;
    players: PlayerRegion[];
    actionButtons: Region;
    dealer: Region;
  };
  
  // Card recognition settings
  cardRecognition: {
    cardWidth: number;
    cardHeight: number;
    cardGap: number;
    useTemplateMatching: boolean;
  };
  
  // Text recognition settings
  textRecognition: {
    fontFamily: string;
    minConfidence: number;
  };
}

// Captured frame data
export interface CapturedFrame {
  imageData: ImageData;
  timestamp: number;
  width: number;
  height: number;
}

// Cropped region result
export interface CroppedRegion {
  region: Region;
  imageData: ImageData;
  label: string;
}

// Screen capture state
export interface CaptureState {
  isCapturing: boolean;
  stream: MediaStream | null;
  fps: number;
  lastFrameTime: number;
  frameCount: number;
  errors: string[];
}

// Capture options
export interface CaptureOptions {
  fps?: number;
  quality?: number;
  detectRegions?: boolean;
}

// Player position info for a specific seat
export interface PlayerPositionConfig {
  seat: Region;
  name: Region;
  stack: Region;
  cards: Region[];
  bet: Region;
  avatar?: Region;
  action?: Region;
}

// Full region configuration for a table layout
export interface RegionConfig {
  pot: Region;
  communityCards: Region[];
  heroCards: Region[];
  players: PlayerPositionConfig[];
  dealer?: Region;
  actionButtons?: Region;
  [key: string]: unknown;
}

// Site-specific configuration
export interface SiteConfig {
  name: string;
  displayName: string;
  backgroundColors: Array<{ r: number; g: number; b: number }>;
  tablePatterns: RegExp[];
  defaultTableSize: number;
  supportedTableSizes: number[];
  regions: {
    [tableSize: number]: RegionConfig;
  };
  ocrSettings: {
    fontFamily: string;
    stackColor: { r: number; g: number; b: number };
    potColor: { r: number; g: number; b: number };
    betColor: { r: number; g: number; b: number };
    minConfidence: number;
  };
  cardSettings: {
    backgroundColor: { r: number; g: number; b: number };
    hiddenCardColor: { r: number; g: number; b: number };
    redColor: { r: number; g: number; b: number };
    blackColor: { r: number; g: number; b: number };
    colorTolerance: number;
  };
  indicators: {
    activePlayerColor: { r: number; g: number; b: number };
    foldedOpacity: number;
    dealerButtonColor: { r: number; g: number; b: number };
  };
}
