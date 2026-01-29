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
