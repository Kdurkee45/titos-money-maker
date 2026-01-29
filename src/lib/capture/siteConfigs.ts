/**
 * Poker Site Configurations
 * Region definitions for different poker sites
 */

import { PokerSiteConfig, PlayerRegion, Region } from './types';

/**
 * Create a player region configuration
 */
function createPlayerRegion(
  seatNumber: number,
  baseX: number,
  baseY: number,
  scale: number = 1
): PlayerRegion {
  return {
    seatNumber,
    x: baseX,
    y: baseY,
    width: 0.12 * scale,
    height: 0.15 * scale,
    nameRegion: { x: baseX, y: baseY, width: 0.1 * scale, height: 0.025 * scale },
    stackRegion: { x: baseX, y: baseY + 0.025, width: 0.1 * scale, height: 0.02 * scale },
    cardsRegion: { x: baseX + 0.02, y: baseY + 0.05, width: 0.08 * scale, height: 0.06 * scale },
    betRegion: { x: baseX + 0.03, y: baseY + 0.12, width: 0.06 * scale, height: 0.02 * scale },
    actionRegion: { x: baseX, y: baseY + 0.14, width: 0.1 * scale, height: 0.02 * scale },
  };
}

/**
 * Generic 9-max table configuration
 * These are approximate regions that work for most poker sites
 * Fine-tuning is needed for each specific site
 */
export const genericConfig: PokerSiteConfig = {
  name: 'generic',
  displayName: 'Generic Poker Site',
  
  windowTitlePattern: /poker|hold'?em|nlhe/i,
  
  tableDetection: {
    backgroundColors: ['#0d5e36', '#1a5f3c', '#0b4d2c', '#2d7a4f'],
    minWidth: 800,
    minHeight: 600,
  },
  
  regions: {
    // Community cards in center of table
    communityCards: {
      x: 0.3,
      y: 0.38,
      width: 0.4,
      height: 0.12,
    },
    
    // Pot display above community cards
    pot: {
      x: 0.4,
      y: 0.32,
      width: 0.2,
      height: 0.05,
    },
    
    // Hero cards at bottom center
    heroCards: {
      x: 0.42,
      y: 0.75,
      width: 0.16,
      height: 0.12,
    },
    
    // Action buttons at bottom
    actionButtons: {
      x: 0.55,
      y: 0.88,
      width: 0.4,
      height: 0.1,
    },
    
    // Dealer button region (will move based on position)
    dealer: {
      x: 0.45,
      y: 0.55,
      width: 0.1,
      height: 0.1,
    },
    
    // 9-max player positions (clockwise from hero at bottom)
    players: [
      // Seat 1: Hero (bottom center)
      createPlayerRegion(1, 0.42, 0.72),
      
      // Seat 2: Bottom right
      createPlayerRegion(2, 0.72, 0.65),
      
      // Seat 3: Right
      createPlayerRegion(3, 0.82, 0.45),
      
      // Seat 4: Top right
      createPlayerRegion(4, 0.72, 0.18),
      
      // Seat 5: Top center-right
      createPlayerRegion(5, 0.52, 0.08),
      
      // Seat 6: Top center-left
      createPlayerRegion(6, 0.32, 0.08),
      
      // Seat 7: Top left
      createPlayerRegion(7, 0.12, 0.18),
      
      // Seat 8: Left
      createPlayerRegion(8, 0.02, 0.45),
      
      // Seat 9: Bottom left
      createPlayerRegion(9, 0.12, 0.65),
    ],
  },
  
  cardRecognition: {
    cardWidth: 50,
    cardHeight: 70,
    cardGap: 5,
    useTemplateMatching: true,
  },
  
  textRecognition: {
    fontFamily: 'Arial',
    minConfidence: 0.6,
  },
};

/**
 * PokerStars configuration
 * Based on the classic PokerStars table layout
 */
export const pokerStarsConfig: PokerSiteConfig = {
  ...genericConfig,
  name: 'pokerstars',
  displayName: 'PokerStars',
  
  windowTitlePattern: /pokerstars/i,
  
  tableDetection: {
    backgroundColors: ['#1a5f3c', '#0d5e36', '#2d7a4f'],
    minWidth: 800,
    minHeight: 600,
  },
  
  regions: {
    ...genericConfig.regions,
    
    // PokerStars-specific adjustments
    communityCards: {
      x: 0.32,
      y: 0.4,
      width: 0.36,
      height: 0.1,
    },
    
    pot: {
      x: 0.42,
      y: 0.35,
      width: 0.16,
      height: 0.04,
    },
  },
};

/**
 * GGPoker configuration
 */
export const ggPokerConfig: PokerSiteConfig = {
  ...genericConfig,
  name: 'ggpoker',
  displayName: 'GGPoker',
  
  windowTitlePattern: /ggpoker|gg\s*poker/i,
  
  tableDetection: {
    backgroundColors: ['#0a3d24', '#0b4d2c', '#1a5f3c'],
    minWidth: 800,
    minHeight: 600,
  },
};

/**
 * Ignition Casino Poker configuration
 * Based on research of Ignition's interface:
 * - Anonymous tables (players shown as seat numbers)
 * - 6-max (Zone Poker) and 9-max tables
 * - Flat modern design, racetrack table shape
 * - 5 color themes: green, red, blue, orange, magenta
 */
export const ignitionConfig: PokerSiteConfig = {
  name: 'ignition',
  displayName: 'Ignition Casino',
  
  windowTitlePattern: /ignition|zone\s*poker/i,
  
  tableDetection: {
    // Ignition's default green felt
    backgroundColors: ['#234a35', '#1a3d2a', '#2d5c42', '#356b4d'],
    minWidth: 800,
    minHeight: 600,
  },
  
  regions: {
    // Community cards in center - 5 cards
    communityCards: {
      x: 0.32,
      y: 0.42,
      width: 0.36,
      height: 0.12,
    },
    
    // Pot display above community cards
    pot: {
      x: 0.42,
      y: 0.35,
      width: 0.16,
      height: 0.05,
    },
    
    // Hero cards at bottom center
    heroCards: {
      x: 0.44,
      y: 0.60,
      width: 0.12,
      height: 0.10,
    },
    
    // Action buttons at bottom right
    actionButtons: {
      x: 0.55,
      y: 0.90,
      width: 0.40,
      height: 0.08,
    },
    
    // Dealer button (D) - scans table area
    dealer: {
      x: 0.30,
      y: 0.30,
      width: 0.40,
      height: 0.40,
    },
    
    // 6-max player positions (Ignition Zone Poker default)
    players: [
      // Seat 1: Hero (bottom center)
      createPlayerRegion(1, 0.42, 0.75),
      
      // Seat 2: Bottom right
      createPlayerRegion(2, 0.72, 0.65),
      
      // Seat 3: Top right  
      createPlayerRegion(3, 0.72, 0.18),
      
      // Seat 4: Top center
      createPlayerRegion(4, 0.42, 0.05),
      
      // Seat 5: Top left
      createPlayerRegion(5, 0.12, 0.18),
      
      // Seat 6: Bottom left
      createPlayerRegion(6, 0.12, 0.65),
    ],
  },
  
  cardRecognition: {
    cardWidth: 55,
    cardHeight: 80,
    cardGap: 3,
    useTemplateMatching: true,
  },
  
  textRecognition: {
    fontFamily: 'sans-serif',
    minConfidence: 0.6,
  },
};

/**
 * All available site configurations
 */
export const siteConfigs: Record<string, PokerSiteConfig> = {
  generic: genericConfig,
  pokerstars: pokerStarsConfig,
  ggpoker: ggPokerConfig,
  ignition: ignitionConfig,
};

/**
 * Get config by site name
 */
export function getSiteConfig(siteName: string): PokerSiteConfig {
  return siteConfigs[siteName.toLowerCase()] || genericConfig;
}

/**
 * Detect poker site from window title
 */
export function detectSite(windowTitle: string): PokerSiteConfig {
  for (const config of Object.values(siteConfigs)) {
    if (config.windowTitlePattern.test(windowTitle)) {
      return config;
    }
  }
  return genericConfig;
}
