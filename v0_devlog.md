# Game Theory Optimal Texas Hold 'Em

## Development Log

### Project Vision
Build **THE premier algorithmic poker assistant** for professional online Texas Hold 'Em players. The goal is real-time GTO recommendations, opponent profiling, and comprehensive decision support during live play.

---

### Phase 1: Project Setup & Tech Stack Decisions

**Date:** Project Initialization

#### Decisions Made:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js | Modern React framework with SSR, great DX, easy Vercel deployment |
| Language | TypeScript | Type safety essential for complex poker logic and data structures |
| Styling | Tailwind CSS | Rapid UI development, consistent design system |
| Database | Supabase | PostgreSQL with built-in auth, realtime subscriptions, generous free tier |
| State Management | Zustand | Lightweight, simple API, works well with React 18+ |
| UI Components | Custom-built | Full control over poker-specific UI needs (cards, tables, ranges) |
| Testing | Playwright | E2E testing for critical user flows |
| Heavy Computation | Web Workers | Keep UI responsive during Monte Carlo equity calculations |
| Package Manager | npm | Standard, reliable, good lockfile support |

#### Why NOT other options:
- **Redux**: Overkill for this app, Zustand is simpler
- **Component libraries (MUI, Chakra)**: Poker UI is too specialized, would fight the library
- **Firebase**: Supabase has better PostgreSQL features for complex queries
- **Vercel KV/Edge**: Need relational data for player stats and hand histories

---

### Phase 2: Dashboard UI Development

**Status:** ✅ Complete

Built a comprehensive poker dashboard with:

| Component | Purpose | File |
|-----------|---------|------|
| `PokerTable` | Visual table representation with player positions | `src/components/PokerTable.tsx` |
| `PlayerCard` | Individual player info with stats | `src/components/PlayerCard.tsx` |
| `EquityDisplay` | Win/tie/lose percentages with pot odds | `src/components/EquityDisplay.tsx` |
| `HandStrengthDisplay` | Current hand ranking and draws | `src/components/HandStrengthDisplay.tsx` |
| `GTORecommendation` | Action recommendations with frequencies | `src/components/GTORecommendation.tsx` |
| `RangeMatrix` | 13x13 hand range visualization | `src/components/RangeMatrix.tsx` |
| `PlayerStats` | HUD-style statistics display | `src/components/PlayerStats.tsx` |
| `BoardAnalysis` | Board texture and draw analysis | `src/components/BoardAnalysis.tsx` |
| `ActionPanel` | Bet/raise/fold controls with sizing | `src/components/ActionPanel.tsx` |
| `SessionStats` | Session P&L and performance | `src/components/SessionStats.tsx` |
| `WinningHands` | Possible hands that beat hero | `src/components/WinningHands.tsx` |
| `PlayerTrackingPanel` | Seat-based player tracking | `src/components/PlayerTrackingPanel.tsx` |

**Design Philosophy:**
- Dark theme (reduces eye strain during long sessions)
- Information density (pros want data, not whitespace)
- Color-coded signals (green = good, red = danger, yellow = caution)
- Real-time updates (no page refreshes)

---

### Phase 3: Backend Architecture

**Status:** ✅ Complete

#### Database Schema Design

Created 8 core tables in Supabase:

```sql
users           -- User profiles (extends Supabase Auth)
players         -- Shared opponent database across all users
player_stats    -- Aggregated statistics per player
sessions        -- Individual poker sessions
hands           -- Hand history records
hand_actions    -- Individual actions within hands
player_observations -- User notes on opponents
precomputed_ranges  -- GTO opening ranges by position
```

**Key Design Decisions:**

1. **Shared Opponent Database**: All users contribute to and benefit from opponent data. When User A plays against "BigStack_Dan", User B can see those stats too.

2. **Anonymous Player Handling**: Ignition Casino uses anonymous tables. Players are identified by seat + behavioral fingerprint, not username.

3. **Row Level Security (RLS)**: Users can only see their own sessions/hands but can read all player stats.

4. **Precomputed Ranges**: GTO opening ranges are expensive to compute. We store them in the database and load on demand.

#### Core Poker Math Library

| Module | Purpose | Complexity |
|--------|---------|------------|
| `handEvaluator.ts` | Evaluates 5-7 card hands, returns ranking | O(C(7,5)) = 21 combinations max |
| `equityCalculator.ts` | Monte Carlo win/tie/lose simulation | 10,000+ iterations for accuracy |
| `boardAnalyzer.ts` | Board texture, draws, nut hands | Pattern matching on community cards |

**Why Monte Carlo for Equity:**
- Exact calculation requires evaluating all opponent hand combinations
- With 2 unknown cards: C(47,2) = 1,081 combinations (fast)
- With 4 unknown cards (2 opponents): Much slower
- Monte Carlo gives 99% accurate results in ~50ms with 10k samples

#### GTO Solver

| Component | Purpose |
|-----------|---------|
| `cfr.ts` | Counterfactual Regret Minimization algorithm |
| `gameTree.ts` | Builds decision tree for a given game state |
| `precomputedRanges.ts` | Opening ranges by position and action |

**Why CFR:**
- Industry standard for poker AI (used in Libratus, Pluribus)
- Converges to Nash equilibrium with sufficient iterations
- Can be simplified for real-time use with smaller game trees

**Limitation:** Full GTO solving is computationally infeasible in real-time. We use:
- Precomputed ranges for pre-flop
- Simplified post-flop trees (limited bet sizes)
- Heuristics for complex spots

---

### Phase 4: Screen Capture & OCR

**Status:** 🚧 In Progress (Blocked)

#### Approach: Screen Capture + OCR

**Why Screen Capture (not API/Hand History):**
- Most poker sites don't have public APIs
- Hand history files are delayed (not real-time)
- Screen capture works with ANY poker site
- Gives us visual data (bet sizes, player actions, timing)

#### Browser-Based Capture (Failed)

**Implementation:**
- Used `navigator.mediaDevices.getDisplayMedia()` API
- Built frame extraction pipeline
- Implemented region detection for cards, pot, players

**Problem Discovered:**
- Browsers return **all-black pixel data** for captured frames
- This is a security restriction to prevent screen scraping
- Affects Chrome, Firefox, Safari when capturing certain content
- Ignition Casino specifically triggers this protection

**Evidence:**
```
🖼️ [Frame Check] Non-black pixels in first 1000: 0/25
❌ [Frame Check] FRAME DATA IS ALL BLACK!
```

#### Electron Desktop App (Current Approach)

**Rationale:**
- Electron uses `desktopCapturer` API with OS-level access
- Bypasses browser security restrictions
- Can request screen recording permission from macOS

**Implementation:**
- Created `electron/main.js` - Main process with IPC handlers
- Created `electron/preload.js` - Secure bridge to renderer
- Created `src/lib/capture/electronCapture.ts` - Client-side API
- Created `src/hooks/useElectronCapture.ts` - React hook
- Created `src/components/ElectronCapturePanel.tsx` - UI

**Current Blocker:**
macOS screen recording permissions are not working correctly when Electron is launched from the command line. The permission appears to be associated with the Terminal app, not the Electron binary.

**Attempted Solutions:**
1. Added Electron to Screen Recording permissions ❌
2. Toggled permission off/on ❌
3. Restarted Electron app ❌
4. Need to try: Add Terminal/Cursor to permissions, or build as signed .app bundle

#### OCR Pipeline

| Component | Purpose |
|-----------|---------|
| `tesseract.ts` | Tesseract.js wrapper for text recognition |
| `cardMatcher.ts` | Card recognition via template matching |
| `cardRecognizer.ts` | Universal card recognition (color + shape) |
| `stateParser.ts` | Converts OCR results to structured game state |

**Card Recognition Design:**
Chose **universal recognition** over site-specific templates:
- Detects card boundaries (white rectangles)
- OCR reads rank from corner (A, K, Q, J, T, 9-2)
- Color analysis for suit (red vs black)
- Shape analysis distinguishes heart/diamond, spade/club

**Why Universal:**
- Works with any card design
- No training data needed
- Handles custom themes
- Easier maintenance

---

### Phase 5: Authentication

**Status:** ✅ Complete

Implemented full Supabase Auth flow:
- Sign up with email/password
- Email verification
- Sign in
- Forgot password / reset password
- Protected routes via `AuthGuard` component
- Session persistence

**Files:**
- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/AuthGuard.tsx`
- `src/hooks/useAuth.ts`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`

---

### Phase 6: Database Seeding

**Status:** ✅ Complete

Seeded precomputed GTO ranges into Supabase:
- UTG, MP, CO, BTN, SB opening ranges
- 3-bet ranges by position
- Defense ranges vs 3-bet

Script: `scripts/seed-ranges.ts`

---

## Known Issues & Blockers

### 🔴 Critical: Screen Capture Permissions (macOS)

**Problem:** Electron's `desktopCapturer.getSources()` returns empty array despite screen recording permission being enabled.

**Root Cause:** When Electron is launched via `npm run electron` from a terminal, macOS associates the screen recording permission with the terminal app, not Electron itself.

**Potential Solutions:**
1. Add Terminal.app / Cursor / iTerm to Screen Recording permissions
2. Build Electron as a signed .app bundle and run directly
3. Use a different capture method (native macOS APIs via node addon)

**Status:** Blocked, sidelined for now

---

## Codebase Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~16,600 |
| TypeScript (.ts) | ~9,700 |
| React Components (.tsx) | ~5,000 |
| JavaScript (.js) | ~270 |
| SQL Migrations | ~755 |
| Source Files | 78 |

---

## Next Steps (Priority Order)

1. **Resolve Electron screen capture permissions**
   - Try adding Terminal to Screen Recording
   - If that fails, build as proper .app bundle

2. **Complete OCR calibration for Ignition**
   - Once capture works, calibrate region positions
   - Test card recognition accuracy

3. **Wire capture to game state**
   - Update Zustand store with OCR results
   - Trigger equity calculations on state change

4. **Real-time recommendations**
   - Connect GTO solver to current game state
   - Display recommendations in UI

5. **Player tracking integration**
   - Save opponent stats to Supabase
   - Load historical data for known opponents

---

## Overview
This project is the premier algorithmic-based tool to play alongside professional online poker players, equipping users with comprehensive decision-making and optimized plays accounting for every possible outcome and factor, including: blind size, number of players, cards in hand, behavioral profiles of other players & historical decisions. This tool identifies all possible future outcomes and provides the user with strategic instructions as to how to proceed at every turn.

**Important: This application is designed exclusively for Texas Hold 'Em poker.** All algorithms, data structures, and UI components are built specifically for:
- 2 hole cards per player
- 5 community cards (3 on flop, 1 on turn, 1 on river)
- Standard 52-card deck (4 suits × 13 ranks)
- 10 standard hand rankings (high card through royal flush)
- 9-max table support (BTN, SB, BB, UTG, UTG+1, MP, MP+1, HJ, CO)

## Tech Stack

| Category | Choice |
|----------|--------|
| Frontend | Next.js |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Hosting | Vercel (web) / Electron (desktop) |
| State Management | Zustand |
| UI Components | Custom (from scratch) |
| Testing | Playwright |
| Package Manager | npm |
| Computation | Client-side (Web Workers for heavy calculations) |
| Desktop App | Electron |

## Running the Application

### Browser Mode (Limited Capture)
```bash
npm run dev
```
Note: Browser-based screen capture may be blocked by browser security restrictions for certain content.

### Electron Desktop Mode (Recommended for Capture)
```bash
npm run electron:dev
```
This launches the app in Electron with native screen capture capabilities that bypass browser restrictions.

### Building for Distribution
```bash
# macOS
npm run electron:build:mac

# Windows
npm run electron:build:win

# Linux
npm run electron:build:linux
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js pages and layouts
├── components/             # React UI components
├── data/                   # Mock data for development
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Supabase authentication
│   ├── useEquityCalculator.ts  # Web Worker equity calc
│   ├── useElectronCapture.ts   # Electron native capture
│   ├── useGameState.ts     # Integrated game state
│   ├── usePlayerStats.ts   # Realtime player stats
│   ├── useScreenCapture.ts # Screen capture with OCR
│   └── useSession.ts       # Session management
├── lib/
│   ├── capture/            # Screen capture system
│   │   └── electronCapture.ts  # Electron desktopCapturer API
│   ├── ocr/                # OCR pipeline (Tesseract.js)
│   ├── poker/              # Core poker math
│   │   ├── handEvaluator.ts   # Hand ranking
│   │   ├── equityCalculator.ts # Monte Carlo equity
│   │   └── boardAnalyzer.ts    # Board texture/draws
│   ├── solver/             # GTO solver
│   │   ├── cfr.ts          # CFR algorithm
│   │   ├── gameTree.ts     # Decision tree
│   │   └── precomputedRanges.ts # Opening ranges
│   └── supabase.ts         # Database client
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
│   ├── database.ts         # Supabase table types
│   └── poker.ts            # UI component types
└── workers/                # Web Workers
    └── equity.worker.ts    # Background equity calc

electron/
├── main.js                 # Electron main process
├── preload.js              # Secure IPC bridge
└── entitlements.mac.plist  # macOS permissions for screen recording
```

### Electron Desktop App

The application can run as either a web app or an Electron desktop application. The Electron version provides:

| Feature | Browser | Electron |
|---------|---------|----------|
| Screen Capture | ⚠️ Limited (security restrictions) | ✅ Full access via desktopCapturer |
| Pixel Data Access | ❌ Often blocked | ✅ Full access |
| Screen Recording Permission | Browser-managed | OS-managed (persistent) |
| Distribution | Web URL | Standalone app (.dmg, .exe, .AppImage) |

**Electron Architecture:**
```
Main Process (Node.js)
├── Window Management
├── desktopCapturer API
├── IPC Handlers (get-sources, capture-frame)
└── System Preferences (permissions)

Preload Script (Bridge)
├── electronAPI.getSources()
├── electronAPI.captureFrame()
├── electronAPI.startContinuousCapture()
└── electronAPI.onCaptureFrame()

Renderer Process (Next.js)
├── useElectronCapture hook
├── ElectronCapturePanel component
└── ElectronSourceSelector component
```

### Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends Supabase Auth) |
| `players` | Shared opponent database |
| `player_stats` | Aggregated player statistics |
| `sessions` | Poker session tracking |
| `hands` | Individual hand histories |
| `hand_actions` | Actions within each hand |
| `player_observations` | User notes on opponents |
| `precomputed_ranges` | GTO range data |

### Core Algorithms

1. **Hand Evaluator** - Evaluates 5-7 card hands using combinatorial analysis
2. **Equity Calculator** - Monte Carlo simulation for win/tie/lose probabilities
3. **Board Analyzer** - Texture analysis, draw detection, nut identification
4. **CFR Solver** - Counterfactual Regret Minimization for GTO strategies
5. **Range Analyzer** - Hand vs range equity calculations

### Data Flow

```
Screen Capture → OCR Pipeline → State Parser → Game Store → UI Components
                                     ↓
                              Poker Math Library
                                     ↓
                              Analysis Results → GTO Recommendations
```

### Player Tracking System

Dynamic player identification and profiling for tables where players join/leave frequently.

| Component | Purpose |
|-----------|---------|
| `SeatState` | Tracks current occupant of each seat position (1-9) |
| `PlayerTracker` | Detects join/leave/rebuy events, creates player records |
| `PlayerFingerprint` | Behavioral markers for anonymous player identification |
| `PlayerChange` | Event record for player transitions |

**Key Logic:**
- Seats are fixed (1-9 for 9-max, 1-6 for 6-max)
- Each seat can have different players hand-to-hand
- Stack size changes trigger new player detection
- Anonymous tables (Ignition) use behavioral fingerprinting
- Behavioral profiles reset when player changes detected

```
OCR Detection → Seat State Update → Player Change Detection
                                           ↓
                              [New Player] → Create DB Record → Initialize Fingerprint
                              [Same Player] → Update Stats → Update Fingerprint
                              [Player Left] → Mark Seat Empty → Archive Session Data
```

### Card Recognition System

Universal card recognition without site-specific templates.

| Method | Description |
|--------|-------------|
| Card Boundary Detection | White rectangle detection to identify card presence |
| OCR Rank Extraction | Tesseract.js reads rank from top-left corner (A, K, Q, J, T, 9-2) |
| Suit Color Analysis | Red = hearts/diamonds, Black = spades/clubs |
| Shape Analysis | Distinguishes heart (top notch) from diamond, spade (stem) from club (3 lobes) |

**Advantages:**
- Works with ANY card design
- No training data required
- Handles theme/color customizations
- Graceful degradation (partial detection still useful)

### Site Configurations

| Site | Status | Notes |
|------|--------|-------|
| Ignition Casino | ✅ Configured | 6-max (Zone Poker) primary, anonymous tables |
| PokerStars | ⚠️ Basic | Generic config, needs calibration |
| GGPoker | ⚠️ Basic | Generic config, needs calibration |
| Generic | ✅ Default | Fallback for unknown sites |

## Glossary

### Position Abbreviations

| Abbrev | Full Name | Description |
|--------|-----------|-------------|
| BTN | Button | Dealer position, acts last post-flop. Most profitable seat. |
| SB | Small Blind | Forced bet, half the big blind. First to act post-flop. |
| BB | Big Blind | Forced bet, sets the minimum bet size. |
| UTG | Under the Gun | First to act pre-flop. Tightest position. |
| UTG+1 | Under the Gun +1 | Second earliest position. |
| MP | Middle Position | Middle of the table, moderate range. |
| HJ | Hijack | Two seats before the button. |
| CO | Cutoff | One seat before the button. Second-best position. |

### Street Names

| Term | Description |
|------|-------------|
| Pre-flop | Before any community cards are dealt. Players have only hole cards. |
| Flop | First three community cards dealt simultaneously. |
| Turn | Fourth community card (aka "4th street"). |
| River | Fifth and final community card (aka "5th street"). |

### Player Statistics (HUD Stats)

| Stat | Full Name | Description | Typical Range |
|------|-----------|-------------|---------------|
| VPIP | Voluntarily Put In Pot | % of hands where player puts money in pre-flop (not including blinds). Higher = looser player. | 15-30% |
| PFR | Pre-Flop Raise | % of hands where player raises pre-flop. Higher = more aggressive. | 10-25% |
| 3-Bet | Three-Bet | % of hands where player re-raises a raise pre-flop. | 5-10% |
| Fold to 3-Bet | Fold to Three-Bet | % of times player folds when facing a 3-bet. | 50-65% |
| AF | Aggression Factor | Ratio of (bets + raises) / calls. Higher = more aggressive. | 1.5-3.0 |
| C-Bet | Continuation Bet | % of times player bets the flop after raising pre-flop. | 60-75% |
| Fold to C-Bet | Fold to Continuation Bet | % of times player folds to a continuation bet. | 40-55% |
| WTSD | Went to Showdown | % of hands that reach showdown when player sees the flop. | 25-35% |
| W$SD | Won Money at Showdown | % of showdowns won. Indicates hand selection quality. | 50-55% |
| BB/100 | Big Blinds per 100 Hands | Win rate measurement. Positive = winning player. | -5 to +15 |

### Player Personas

| Persona | Description | Typical Stats |
|---------|-------------|---------------|
| TAG | Tight-Aggressive | Plays few hands but plays them aggressively. VPIP 18-24%, PFR 15-22%. |
| LAG | Loose-Aggressive | Plays many hands aggressively. VPIP 28-40%, PFR 24-35%. |
| Nit | Very Tight | Only plays premium hands. VPIP < 15%, PFR < 12%. |
| Fish | Loose-Passive | Plays too many hands, calls too much. High VPIP, low PFR. |
| Shark | Skilled Player | Balanced, adapts to opponents, exploits weaknesses. |
| Calling Station | Passive Caller | Rarely folds, calls with weak hands. Low fold to C-bet. |
| Maniac | Hyper-Aggressive | Raises constantly, high bluff frequency. Very high AF. |

### Equity & Odds

| Term | Description |
|------|-------------|
| Equity | Your % chance to win the pot if all cards are dealt out. |
| Pot Odds | Ratio of current pot size to the cost of calling. |
| Implied Odds | Pot odds adjusted for expected future bets you'll win. |
| Required Equity | Minimum equity needed to make a call profitable. |
| EV | Expected Value | The average amount you expect to win/lose on a decision. |
| Outs | Cards remaining in the deck that will improve your hand. |

### Hand Strength

| Ranking | Hand | Description |
|---------|------|-------------|
| 1 | Royal Flush | A-K-Q-J-T of the same suit |
| 2 | Straight Flush | Five consecutive cards of the same suit |
| 3 | Four of a Kind | Four cards of the same rank (Quads) |
| 4 | Full House | Three of a kind + a pair (Boat) |
| 5 | Flush | Five cards of the same suit |
| 6 | Straight | Five consecutive cards |
| 7 | Three of a Kind | Three cards of the same rank (Set/Trips) |
| 8 | Two Pair | Two different pairs |
| 9 | One Pair | Two cards of the same rank |
| 10 | High Card | No made hand, highest card plays |

### Board Texture

| Term | Description |
|------|-------------|
| Dry Board | Few draws possible (e.g., K-7-2 rainbow). Favors pre-flop aggressor. |
| Wet Board | Many draws possible (e.g., J-T-9 two-tone). More vulnerable to draws. |
| Rainbow | Three different suits on the flop. No flush draw possible. |
| Monotone | All three flop cards same suit. Flush possible. |
| Two-Tone | Two cards of one suit. Flush draw possible. |
| Paired Board | Board contains a pair. Full house/quads possible. |
| Connected | Cards close in rank (straight draws likely). |

### GTO & Strategy

| Term | Description |
|------|-------------|
| GTO | Game Theory Optimal | Unexploitable strategy that cannot be beaten long-term. |
| Exploitative | Adjusting strategy to take advantage of opponent mistakes. |
| Range | The set of all possible hands a player could have. |
| Combos | Number of specific hand combinations (e.g., AKs = 4 combos). |
| Blocker | Holding a card that reduces opponent's possible holdings. |
| ICM | Independent Chip Model | Tournament equity calculation based on stack sizes. |
| SPR | Stack-to-Pot Ratio | Effective stack divided by pot size. Influences strategy. |

### Common Abbreviations

| Abbrev | Meaning |
|--------|---------|
| s | Suited (e.g., AKs = Ace-King suited) |
| o | Offsuit (e.g., AKo = Ace-King offsuit) |
| TPTK | Top Pair Top Kicker |
| OESD | Open-Ended Straight Draw (8 outs) |
| FD | Flush Draw (9 outs) |
| NFD | Nut Flush Draw |
| GS | Gutshot (inside straight draw, 4 outs) |
| OOP | Out of Position (acting first) |
| IP | In Position (acting last) |
| Villain | Opponent(s) |
| Hero | You / the player using the tool |

