import type { BallByBallRecord, Match, Team, WicketType } from '../backend';

export function formatOvers(balls: number): string {
  const overs = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${overs}.${rem}`;
}

export function formatOversBigInt(deliveries: BallByBallRecord[]): string {
  const legalBalls = deliveries.filter(d => !d.isWide && !d.isNoBall).length;
  return formatOvers(legalBalls);
}

export function calcRunRate(runs: number, balls: number): string {
  if (balls === 0) return '0.00';
  const rr = (runs / balls) * 6;
  return rr.toFixed(2);
}

export function calcRequiredRunRate(target: number, currentRuns: number, ballsRemaining: number): string {
  if (ballsRemaining <= 0) return '∞';
  const needed = target - currentRuns;
  if (needed <= 0) return '0.00';
  const rr = (needed / ballsRemaining) * 6;
  return rr.toFixed(2);
}

export function getWicketLabel(wicket: WicketType): string {
  switch (wicket.__kind__) {
    case 'Bowled': return 'b';
    case 'Caught': return 'c';
    case 'LBW': return 'lbw';
    case 'RunOut': return 'run out';
    case 'Stumped': return 'st';
    case 'HitWicket': return 'hit wkt';
    case 'Other': return wicket.Other || 'out';
    default: return 'out';
  }
}

export function getBallLabel(ball: BallByBallRecord): string {
  if (ball.wicket) return 'W';
  if (ball.isWide) return 'Wd';
  if (ball.isNoBall) return 'Nb';
  const runs = Number(ball.runs);
  if (runs === 0) return '•';
  if (runs === 4) return '4';
  if (runs === 6) return '6';
  return String(runs);
}

export function getBallColor(ball: BallByBallRecord): string {
  if (ball.wicket) return 'bg-cricket-red text-white';
  if (ball.isWide || ball.isNoBall) return 'bg-cricket-gold text-white';
  const runs = Number(ball.runs);
  if (runs === 0) return 'bg-muted text-muted-foreground';
  if (runs === 4) return 'bg-blue-500 text-white';
  if (runs === 6) return 'bg-purple-600 text-white';
  return 'bg-cricket-green text-white';
}

export interface BatsmanStats {
  playerId: bigint;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  isOut: boolean;
  dismissal: string;
}

export interface BowlerStats {
  playerId: bigint;
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: string;
}

export function calcBatsmanStats(
  deliveries: BallByBallRecord[],
  playerId: bigint,
  playerName: string
): BatsmanStats {
  const myBalls = deliveries.filter(d => d.batsmanId === playerId);
  const legalBalls = myBalls.filter(d => !d.isWide);
  const runs = legalBalls.reduce((s, d) => s + Number(d.runs), 0);
  const balls = legalBalls.length;
  const fours = legalBalls.filter(d => Number(d.runs) === 4).length;
  const sixes = legalBalls.filter(d => Number(d.runs) === 6).length;
  const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
  const wicketBall = myBalls.find(d => d.wicket);
  const isOut = !!wicketBall;
  const dismissal = wicketBall?.wicket ? getWicketLabel(wicketBall.wicket) : '';
  return { playerId, name: playerName, runs, balls, fours, sixes, strikeRate, isOut, dismissal };
}

export function calcBowlerStats(
  deliveries: BallByBallRecord[],
  playerId: bigint,
  playerName: string
): BowlerStats {
  const myBalls = deliveries.filter(d => d.bowlerId === playerId);
  const legalBalls = myBalls.filter(d => !d.isWide && !d.isNoBall);
  const runs = myBalls.reduce((s, d) => s + Number(d.runs), 0);
  const wickets = myBalls.filter(d => d.wicket).length;
  const totalBalls = legalBalls.length;
  const overs = formatOvers(totalBalls);

  // Calculate maidens
  const overMap = new Map<number, BallByBallRecord[]>();
  for (const d of myBalls) {
    const ov = Number(d.overNumber);
    if (!overMap.has(ov)) overMap.set(ov, []);
    overMap.get(ov)!.push(d);
  }
  let maidens = 0;
  for (const [, balls] of overMap) {
    const legalInOver = balls.filter(b => !b.isWide && !b.isNoBall);
    if (legalInOver.length === 6) {
      const runsInOver = balls.reduce((s, b) => s + Number(b.runs), 0);
      if (runsInOver === 0 && !balls.some(b => b.wicket)) maidens++;
    }
  }

  const economy = totalBalls > 0 ? ((runs / totalBalls) * 6).toFixed(2) : '0.00';
  return { playerId, name: playerName, overs, maidens, runs, wickets, economy };
}

export function getInningsDeliveries(match: Match, inningsIndex: number): BallByBallRecord[] {
  if (!match.deliveries) return [];
  // Filter by innings - use overNumber ranges based on innings
  // Since backend stores all deliveries flat, we need to figure out innings from context
  // The innings array tracks overs per innings
  return match.deliveries;
}

export function getMatchStatus(match: Match, teamA: Team | null, teamB: Team | null): string {
  if (match.isFinished) {
    if (match.winner !== undefined && match.winner !== null) {
      const winnerId = match.winner;
      const winnerName = winnerId === match.teamAId
        ? (teamA?.name ?? 'Team A')
        : (teamB?.name ?? 'Team B');
      return `${winnerName} won`;
    }
    return 'Match completed';
  }
  return 'In Progress';
}

export function getTotalExtras(deliveries: BallByBallRecord[]): {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  total: number;
} {
  // BallByBallRecord doesn't have isBye/isLegBye, so we approximate
  const wides = deliveries.filter(d => d.isWide).length;
  const noBalls = deliveries.filter(d => d.isNoBall).length;
  return { wides, noBalls, byes: 0, legByes: 0, total: wides + noBalls };
}
