/**
 * Seed Precomputed Ranges Script
 * Run with: npx tsx scripts/seed-ranges.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// OPENING RANGES (RFI - Raise First In)
// ============================================================================

const UTG_OPEN_100BB: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 0.5, '77': 0.25,
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 0.75,
  'KQs': 1, 'KJs': 0.5, 'KTs': 0.25,
  'QJs': 0.5, 'QTs': 0.25,
  'JTs': 0.25,
  'AKo': 1, 'AQo': 0.75, 'AJo': 0.25,
  'KQo': 0.25,
};

const MP_OPEN_100BB: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 0.5, '66': 0.25,
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 0.25,
  'KQs': 1, 'KJs': 1, 'KTs': 0.5,
  'QJs': 1, 'QTs': 0.5,
  'JTs': 0.75,
  'T9s': 0.25, '98s': 0.25,
  'AKo': 1, 'AQo': 1, 'AJo': 0.5, 'ATo': 0.25,
  'KQo': 0.75, 'KJo': 0.25,
};

const CO_OPEN_100BB: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 0.5, '44': 0.25, '33': 0.25, '22': 0.25,
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 0.75, 'A7s': 0.5, 'A6s': 0.5, 'A5s': 1, 'A4s': 0.75, 'A3s': 0.5, 'A2s': 0.5,
  'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 0.5,
  'QJs': 1, 'QTs': 1, 'Q9s': 0.5,
  'JTs': 1, 'J9s': 0.5,
  'T9s': 1,
  '98s': 1, '87s': 0.75, '76s': 0.5, '65s': 0.5, '54s': 0.5,
  'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 0.75, 'A9o': 0.25,
  'KQo': 1, 'KJo': 0.75, 'KTo': 0.5,
  'QJo': 0.75, 'QTo': 0.25,
  'JTo': 0.5,
};

const BTN_OPEN_100BB: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 1, '44': 1, '33': 1, '22': 1,
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 1, 'A5s': 1, 'A4s': 1, 'A3s': 1, 'A2s': 1,
  'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 0.75, 'K7s': 0.5, 'K6s': 0.5, 'K5s': 0.5, 'K4s': 0.25,
  'QJs': 1, 'QTs': 1, 'Q9s': 1, 'Q8s': 0.75, 'Q7s': 0.5, 'Q6s': 0.25,
  'JTs': 1, 'J9s': 1, 'J8s': 0.75, 'J7s': 0.5,
  'T9s': 1, 'T8s': 0.75, '98s': 1, '97s': 0.5, '87s': 1, '86s': 0.5, '76s': 1, '75s': 0.5, '65s': 1, '64s': 0.25, '54s': 1, '53s': 0.25, '43s': 0.5,
  'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 1, 'A9o': 0.75, 'A8o': 0.5, 'A7o': 0.5, 'A6o': 0.25, 'A5o': 0.5, 'A4o': 0.25, 'A3o': 0.25, 'A2o': 0.25,
  'KQo': 1, 'KJo': 1, 'KTo': 1, 'K9o': 0.5, 'K8o': 0.25,
  'QJo': 1, 'QTo': 0.75, 'Q9o': 0.25,
  'JTo': 1, 'J9o': 0.5,
  'T9o': 0.5,
};

const SB_OPEN_100BB: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 1, '44': 1, '33': 1, '22': 1,
  'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 1, 'A5s': 1, 'A4s': 1, 'A3s': 1, 'A2s': 1,
  'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 0.5, 'K7s': 0.5, 'K6s': 0.5, 'K5s': 0.5, 'K4s': 0.25, 'K3s': 0.25, 'K2s': 0.25,
  'QJs': 1, 'QTs': 1, 'Q9s': 1, 'Q8s': 0.5, 'Q7s': 0.25, 'Q6s': 0.25,
  'JTs': 1, 'J9s': 1, 'T9s': 1, '98s': 1, '87s': 1, '76s': 1, '65s': 1, '54s': 1,
  'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 1, 'A9o': 0.75, 'A8o': 0.5, 'A7o': 0.5, 'A6o': 0.25, 'A5o': 0.5, 'A4o': 0.25,
  'KQo': 1, 'KJo': 1, 'KTo': 0.75, 'K9o': 0.25,
  'QJo': 1, 'QTo': 0.5,
  'JTo': 0.75,
};

// ============================================================================
// 3-BET RANGES
// ============================================================================

const BTN_3BET_VS_UTG: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 0.5, 'AKs': 1, 'AKo': 1,
  'A5s': 0.5, 'A4s': 0.5, 'A3s': 0.25,
  'KQs': 0.25, 'AQs': 0.5,
};

const BTN_3BET_VS_CO: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 0.5,
  'AKs': 1, 'AKo': 1, 'AQs': 1, 'AQo': 0.5,
  'A5s': 1, 'A4s': 0.75, 'A3s': 0.5, 'A2s': 0.25,
  'K5s': 0.25, 'K4s': 0.25,
  '76s': 0.25, '65s': 0.25, '54s': 0.25,
};

const BB_3BET_VS_BTN: Record<string, number> = {
  'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 0.75, '99': 0.25,
  'AKs': 1, 'AKo': 1, 'AQs': 1, 'AQo': 0.75, 'AJs': 0.5,
  'KQs': 0.5,
  'A5s': 1, 'A4s': 1, 'A3s': 0.75, 'A2s': 0.5,
  'K9s': 0.25, 'K8s': 0.25,
  'Q9s': 0.25, 'J9s': 0.25, 'T9s': 0.25,
  '87s': 0.25, '76s': 0.25, '65s': 0.25, '54s': 0.25,
};

// ============================================================================
// CALLING RANGES
// ============================================================================

const BB_CALL_VS_BTN: Record<string, number> = {
  '99': 0.75, '88': 1, '77': 1, '66': 1, '55': 1, '44': 1, '33': 1, '22': 1,
  'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 1, 'A5s': 0.5, 'A4s': 0.5, 'A3s': 0.5, 'A2s': 0.5,
  'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 1, 'K7s': 0.75, 'K6s': 0.5, 'K5s': 0.5, 'K4s': 0.25,
  'QTs': 1, 'Q9s': 1, 'Q8s': 0.75, 'Q7s': 0.5, 'Q6s': 0.25,
  'JTs': 1, 'J9s': 1, 'J8s': 0.5,
  'T9s': 1, 'T8s': 0.75,
  '98s': 1, '97s': 0.5,
  '87s': 1, '86s': 0.5,
  '76s': 1, '75s': 0.25,
  '65s': 1, '54s': 1, '43s': 0.5,
  'ATo': 1, 'A9o': 0.75, 'A8o': 0.5, 'A7o': 0.25, 'A6o': 0.25, 'A5o': 0.25,
  'KTo': 0.75, 'K9o': 0.5,
  'QJo': 0.5, 'QTo': 0.25,
  'JTo': 0.5, 'J9o': 0.25,
  'T9o': 0.25,
};

// ============================================================================
// ALL RANGES TO SEED
// ============================================================================

interface RangeToSeed {
  situation_key: string;
  position: string;
  action_type: string;
  stack_depth_bb: number;
  range_data: Record<string, number>;
  description: string;
  source: string;
}

const RANGES_TO_SEED: RangeToSeed[] = [
  // Opening ranges
  {
    situation_key: 'UTG_open_100bb',
    position: 'UTG',
    action_type: 'open',
    stack_depth_bb: 100,
    range_data: UTG_OPEN_100BB,
    description: 'UTG opening range at 100bb effective stacks',
    source: 'gto_approximation',
  },
  {
    situation_key: 'MP_open_100bb',
    position: 'MP',
    action_type: 'open',
    stack_depth_bb: 100,
    range_data: MP_OPEN_100BB,
    description: 'MP opening range at 100bb effective stacks',
    source: 'gto_approximation',
  },
  {
    situation_key: 'CO_open_100bb',
    position: 'CO',
    action_type: 'open',
    stack_depth_bb: 100,
    range_data: CO_OPEN_100BB,
    description: 'CO opening range at 100bb effective stacks',
    source: 'gto_approximation',
  },
  {
    situation_key: 'BTN_open_100bb',
    position: 'BTN',
    action_type: 'open',
    stack_depth_bb: 100,
    range_data: BTN_OPEN_100BB,
    description: 'BTN opening range at 100bb effective stacks',
    source: 'gto_approximation',
  },
  {
    situation_key: 'SB_open_100bb',
    position: 'SB',
    action_type: 'open',
    stack_depth_bb: 100,
    range_data: SB_OPEN_100BB,
    description: 'SB opening range vs BB at 100bb effective stacks',
    source: 'gto_approximation',
  },
  // 3-bet ranges
  {
    situation_key: 'BTN_3bet_vs_UTG',
    position: 'BTN',
    action_type: '3bet_vs_UTG',
    stack_depth_bb: 100,
    range_data: BTN_3BET_VS_UTG,
    description: 'BTN 3-bet range vs UTG open at 100bb',
    source: 'gto_approximation',
  },
  {
    situation_key: 'BTN_3bet_vs_CO',
    position: 'BTN',
    action_type: '3bet_vs_CO',
    stack_depth_bb: 100,
    range_data: BTN_3BET_VS_CO,
    description: 'BTN 3-bet range vs CO open at 100bb',
    source: 'gto_approximation',
  },
  {
    situation_key: 'BB_3bet_vs_BTN',
    position: 'BB',
    action_type: '3bet_vs_BTN',
    stack_depth_bb: 100,
    range_data: BB_3BET_VS_BTN,
    description: 'BB 3-bet range vs BTN open at 100bb',
    source: 'gto_approximation',
  },
  // Calling ranges
  {
    situation_key: 'BB_call_vs_BTN',
    position: 'BB',
    action_type: 'call_vs_BTN',
    stack_depth_bb: 100,
    range_data: BB_CALL_VS_BTN,
    description: 'BB calling range vs BTN open at 100bb',
    source: 'gto_approximation',
  },
];

async function seedRanges() {
  console.log('🎯 Seeding precomputed ranges...\n');

  for (const range of RANGES_TO_SEED) {
    console.log(`  📊 ${range.situation_key}...`);
    
    const { error } = await supabase
      .from('precomputed_ranges')
      .upsert(
        {
          situation_key: range.situation_key,
          position: range.position,
          action_type: range.action_type,
          stack_depth_bb: range.stack_depth_bb,
          range_data: range.range_data,
          description: range.description,
          source: range.source,
        },
        { onConflict: 'situation_key' }
      );

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Done`);
    }
  }

  console.log('\n✨ Seeding complete!');
  console.log(`   Total ranges: ${RANGES_TO_SEED.length}`);
}

// Run the seed
seedRanges().catch(console.error);
