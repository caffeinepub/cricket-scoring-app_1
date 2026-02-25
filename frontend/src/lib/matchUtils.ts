import { Delivery, Innings } from '@/backend';

export interface InningsStats {
  totalRuns: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: number;
  runRate: number;
}

export interface BatsmanStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
}

export interface BowlerStats {
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

/**
 * Calculate innings stats from a list of deliveries.
 * Correctly sums all runs including extras (wides, no-balls, byes, leg-byes).
 */
export function calculateInningsStats(deliveries: Delivery[]): InningsStats {
  if (!deliveries || deliveries.length === 0) {
    return { totalRuns: 0, wickets: 0, overs: 0, balls: 0, extras: 0, runRate: 0 };
  }

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let extras = 0;

  for (const delivery of deliveries) {
    // Sum all runs from every delivery (runs already includes extras in the backend model)
    const runs = typeof delivery.runs === 'bigint' ? Number(delivery.runs) : Number(delivery.runs);
    totalRuns += runs;

    // Count extras separately for display
    if (delivery.isWide || delivery.isNoBall || delivery.isBye || delivery.isLegBye) {
      extras += runs;
    }

    // Only count legal balls (not wides or no-balls)
    if (!delivery.isWide && !delivery.isNoBall) {
      legalBalls++;
    }

    // Count wickets (but not run-outs on no-balls in some formats — simplified here)
    if (delivery.wicket) {
      wickets++;
    }
  }

  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  const totalOversDecimal = overs + balls / 6;
  const runRate = totalOversDecimal > 0 ? totalRuns / totalOversDecimal : 0;

  return { totalRuns, wickets, overs, balls, extras, runRate };
}

/**
 * Calculate batsman stats from deliveries for a specific batsman.
 */
export function calculateBatsmanStats(deliveries: Delivery[], batsmanId: bigint): BatsmanStats {
  const batsmanDeliveries = deliveries.filter(d => d.batsmanId === batsmanId);

  let runs = 0;
  let balls = 0;
  let fours = 0;
  let sixes = 0;
  let isOut = false;

  for (const delivery of batsmanDeliveries) {
    const deliveryRuns = typeof delivery.runs === 'bigint' ? Number(delivery.runs) : Number(delivery.runs);

    // Only count balls faced (not wides)
    if (!delivery.isWide) {
      balls++;
      // Only count runs scored by batsman (not byes/leg-byes)
      if (!delivery.isBye && !delivery.isLegBye) {
        runs += deliveryRuns;
        if (deliveryRuns === 4) fours++;
        if (deliveryRuns === 6) sixes++;
      }
    }

    if (delivery.wicket) {
      isOut = true;
    }
  }

  const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;

  return { runs, balls, fours, sixes, strikeRate, isOut };
}

/**
 * Calculate bowler stats from deliveries for a specific bowler.
 */
export function calculateBowlerStats(deliveries: Delivery[], bowlerId: bigint): BowlerStats {
  const bowlerDeliveries = deliveries.filter(d => d.bowlerId === bowlerId);

  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wides = 0;
  let noBalls = 0;

  for (const delivery of bowlerDeliveries) {
    const deliveryRuns = typeof delivery.runs === 'bigint' ? Number(delivery.runs) : Number(delivery.runs);
    runs += deliveryRuns;

    if (delivery.isWide) {
      wides++;
    } else if (delivery.isNoBall) {
      noBalls++;
    } else {
      legalBalls++;
    }

    if (delivery.wicket) {
      wickets++;
    }
  }

  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  const totalOversDecimal = overs + balls / 6;
  const economy = totalOversDecimal > 0 ? runs / totalOversDecimal : 0;

  return { overs, balls, runs, wickets, economy, wides, noBalls };
}

/**
 * Format overs display (e.g., "3.2" for 3 overs 2 balls)
 */
export function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

/**
 * Get the current over number (0-indexed) from legal ball count
 */
export function getCurrentOverNumber(legalBalls: number): number {
  return Math.floor(legalBalls / 6);
}

/**
 * Check if an innings should end based on overs completed
 */
export function isInningsComplete(deliveries: Delivery[], oversLimit: number): boolean {
  if (oversLimit <= 0) return false;
  let legalBalls = 0;
  for (const delivery of deliveries) {
    if (!delivery.isWide && !delivery.isNoBall) {
      legalBalls++;
    }
  }
  const completedOvers = Math.floor(legalBalls / 6);
  return completedOvers >= oversLimit;
}
