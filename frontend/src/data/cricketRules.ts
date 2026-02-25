import type { TournamentRules } from '../backend';

export interface CricketRule {
  title: string;
  content: string;
}

export interface CricketRuleCategory {
  category: string;
  icon: string;
  rules: CricketRule[];
}

export const cricketRules: CricketRuleCategory[] = [
  {
    category: 'Scoring',
    icon: '🏏',
    rules: [
      {
        title: 'Runs',
        content: 'A run is scored when both batsmen successfully run to the opposite end of the pitch. The batting team accumulates runs to build their total score.',
      },
      {
        title: 'Boundaries – Four (4)',
        content: 'If the ball reaches the boundary rope after touching the ground, 4 runs are automatically awarded to the batting team. The batsmen do not need to run.',
      },
      {
        title: 'Boundaries – Six (6)',
        content: 'If the ball clears the boundary rope without touching the ground (hit over the rope in the air), 6 runs are automatically awarded. This is the maximum runs from a single delivery.',
      },
      {
        title: 'Strike Rate',
        content: 'A batsman\'s strike rate is calculated as (Runs Scored ÷ Balls Faced) × 100. A strike rate of 100 means the batsman scores one run per ball on average.',
      },
      {
        title: 'Run Rate (RR)',
        content: 'The current run rate is calculated as (Total Runs ÷ Overs Bowled). It represents the average number of runs scored per over.',
      },
      {
        title: 'Required Run Rate (RRR)',
        content: 'In the second innings, the required run rate is (Runs Needed ÷ Overs Remaining). It shows how many runs per over the batting team needs to win.',
      },
    ],
  },
  {
    category: 'Extras',
    icon: '➕',
    rules: [
      {
        title: 'Wide',
        content: 'A wide is called when the bowler delivers the ball too far from the batsman to be hit with a normal cricket stroke. One extra run is added to the batting team\'s score, and the delivery must be bowled again (it does not count as a legal delivery).',
      },
      {
        title: 'No-Ball',
        content: 'A no-ball is called for various reasons: the bowler overstepping the crease, bowling a full-toss above waist height, or other illegal deliveries. One extra run is added, and the delivery must be re-bowled. A no-ball cannot result in a batsman being out (except run-out).',
      },
      {
        title: 'Bye',
        content: 'A bye is scored when the ball passes the batsman without touching the bat or body, and the batsmen complete runs. The runs are credited as extras, not to the batsman\'s personal score.',
      },
      {
        title: 'Leg Bye',
        content: 'A leg bye is scored when the ball hits the batsman\'s body (not the bat) and the batsmen complete runs. The batsman must have attempted to play a shot or avoid the ball. Runs are credited as extras.',
      },
      {
        title: 'Penalty Runs',
        content: 'Five penalty runs can be awarded to either team for various infractions, such as the ball hitting a fielder\'s helmet placed on the ground, or deliberate time-wasting.',
      },
    ],
  },
  {
    category: 'Dismissals',
    icon: '🚨',
    rules: [
      {
        title: 'Bowled',
        content: 'The batsman is out bowled when the ball, delivered by the bowler, hits the stumps and dislodges at least one bail. This applies even if the ball first touches the bat or the batsman\'s body.',
      },
      {
        title: 'Caught',
        content: 'The batsman is out caught when a fielder catches the ball cleanly before it touches the ground, after the ball has come off the bat or the batsman\'s glove (while holding the bat).',
      },
      {
        title: 'LBW (Leg Before Wicket)',
        content: 'The batsman is out LBW when the ball hits the batsman\'s body (not the bat) and the umpire judges it would have gone on to hit the stumps. The ball must pitch in line with the stumps or on the off side, and the batsman must not be playing a shot (or the ball must pitch in line).',
      },
      {
        title: 'Run Out',
        content: 'A batsman is run out when a fielder breaks the stumps with the ball while the batsman is outside the crease and attempting a run. Either batsman can be run out.',
      },
      {
        title: 'Stumped',
        content: 'The batsman is stumped when the wicket-keeper breaks the stumps with the ball while the batsman is outside the crease and not attempting a run. The batsman must have moved out of the crease to play the ball.',
      },
      {
        title: 'Hit Wicket',
        content: 'The batsman is out hit wicket when they dislodge the bails with their bat or body while playing a shot or setting off for a run on the first delivery.',
      },
      {
        title: 'Handled the Ball',
        content: 'A batsman is out if they deliberately touch the ball with a hand not holding the bat, without the consent of the fielding side. This is now covered under "Obstructing the Field."',
      },
      {
        title: 'Obstructing the Field',
        content: 'A batsman is out if they deliberately obstruct a fielder by word or action. This includes deliberately deflecting the ball with the bat or body to prevent a catch or run-out.',
      },
      {
        title: 'Hit the Ball Twice',
        content: 'A batsman is out if they deliberately hit the ball a second time with the bat or body, except to guard the wicket.',
      },
      {
        title: 'Timed Out',
        content: 'An incoming batsman must be ready to face the next ball within 3 minutes of the previous wicket falling. Failure to do so results in a timed out dismissal.',
      },
      {
        title: 'Retired Out',
        content: 'A batsman who retires without the umpire\'s permission is out retired. A batsman who retires due to injury or illness is not out and may return to bat later.',
      },
    ],
  },
  {
    category: 'Powerplay',
    icon: '⚡',
    rules: [
      {
        title: 'Powerplay Overview',
        content: 'Powerplay overs restrict the number of fielders allowed outside the 30-yard circle. During powerplay, only 2 fielders are allowed outside the circle, making it easier for batsmen to score boundaries.',
      },
      {
        title: 'Mandatory Powerplay (ODI)',
        content: 'In One Day Internationals (50 overs), the first 10 overs are a mandatory powerplay. Only 2 fielders are allowed outside the 30-yard circle during this period.',
      },
      {
        title: 'T20 Powerplay',
        content: 'In T20 cricket (20 overs), the first 6 overs are the powerplay. Only 2 fielders are allowed outside the 30-yard circle. This creates high-scoring opportunities at the start of the innings.',
      },
      {
        title: 'Fielding Restrictions',
        content: 'Outside the powerplay, a maximum of 5 fielders are allowed outside the 30-yard circle. At least 4 fielders (plus the wicket-keeper) must be inside the circle at all times.',
      },
      {
        title: 'Custom Powerplay',
        content: 'In this app, you can configure custom powerplay over ranges for your match. Set the start and end overs for the powerplay period in the match setup screen.',
      },
    ],
  },
  {
    category: 'Special Rules',
    icon: '⭐',
    rules: [
      {
        title: 'Free Hit',
        content: 'After a no-ball (for overstepping the crease), the next delivery is a "free hit." On a free hit, the batsman cannot be dismissed by any method except run-out, hit the ball twice, or obstructing the field. The fielding positions cannot be changed between the no-ball and the free hit.',
      },
      {
        title: 'Super Over',
        content: 'If a match is tied after the allotted overs, a Super Over (one over per side) is played to determine the winner. Each team nominates 2 batsmen and 1 bowler for the Super Over.',
      },
      {
        title: 'Duckworth-Lewis-Stern (DLS) Method',
        content: 'The DLS method is used to calculate revised targets in rain-affected matches. It accounts for the resources (overs and wickets) remaining for each team. In this app, you can manually set a revised target using the DLS override feature.',
      },
      {
        title: 'Follow-On',
        content: 'In Test cricket, if the team batting second scores significantly fewer runs than the first team (200 runs in a 5-day match), the first team can enforce the follow-on, requiring the second team to bat again immediately.',
      },
      {
        title: 'Dead Ball',
        content: 'A dead ball is called when the ball is not in play. No runs can be scored and no wickets can fall from a dead ball. Common reasons include the ball lodging in a fielder\'s clothing or the umpire calling time.',
      },
      {
        title: 'Overthrows',
        content: 'If a fielder throws the ball and it goes to the boundary or the batsmen complete additional runs, these are called overthrows. The runs are added to the batting team\'s total.',
      },
      {
        title: 'Toss',
        content: 'Before the match, the two captains toss a coin. The winner of the toss decides whether their team will bat or bowl first. The toss can be crucial in certain conditions (e.g., morning dew, pitch deterioration).',
      },
      {
        title: 'Over',
        content: 'An over consists of 6 legal deliveries bowled by the same bowler from the same end. Wides and no-balls do not count as legal deliveries and must be re-bowled. After each over, the bowling end changes.',
      },
      {
        title: 'Maximum Overs Per Bowler',
        content: 'In limited-overs cricket, each bowler is restricted to a maximum number of overs. In T20, each bowler can bowl a maximum of 4 overs. In ODIs, the limit is 10 overs. This app allows you to configure this limit.',
      },
    ],
  },
];

// ─── Tournament Rules (dynamic, config-driven) ───────────────────────────────

export function getTournamentRules(config: TournamentRules): CricketRuleCategory[] {
  const leagueOvers = Number(config.leagueOvers);
  const finalOvers = Number(config.finalOvers);
  const totalMatches = Number(config.totalMatches);
  const numTeams = Number(config.numTeams);
  const leagueMatches = Number(config.leagueMatches);
  const knockoutMatches = Number(config.knockoutMatches);
  const semifinalMatches = Number(config.semifinalMatches);
  const finalMatches = Number(config.finalMatches);
  const leaguePowerplayOvers = Number(config.leaguePowerplayOvers);
  const finalPowerplayOvers = Number(config.finalPowerplayOvers);
  const maxFieldersOutside30Yards = Number(config.maxFieldersOutside30Yards);
  const timeoutDurationSeconds = Number(config.timeoutDurationSeconds);
  const teamReadinessPenaltyMinutes = Number(config.teamReadinessPenaltyMinutes);
  const teamReadinessPenaltyOvers = Number(config.teamReadinessPenaltyOvers);
  const slowOverRatePenaltyRuns = Number(config.slowOverRatePenaltyRuns);
  const inningsDurationMinutes = Number(config.inningsDurationMinutes);
  const maxBallsPerBatsmanShortFormat = Number(config.maxBallsPerBatsmanShortFormat);
  const maxBallsPerBatsmanLongFormat = Number(config.maxBallsPerBatsmanLongFormat);
  const maxOversBowlerShortFormat = Number(config.maxOversBowlerShortFormat);
  const maxOversBowlerLongFormat = Number(config.maxOversBowlerLongFormat);
  const bouncerLimitPerOver = Number(config.bouncerLimitPerOver);
  const widesNoBallBowlerChangeThreshold = Number(config.widesNoBallBowlerChangeThreshold);
  const defaultPenaltyRuns = Number(config.defaultPenaltyRuns);

  return [
    {
      category: 'Match Format',
      icon: '🏆',
      rules: [
        {
          title: 'Tournament Overview',
          content: `Total number of matches: ${totalMatches}. The tournament features ${numTeams} teams competing across ${leagueMatches} league matches, ${knockoutMatches} knock-out matches, ${semifinalMatches} semi-final matches, and ${finalMatches} final match(es).`,
        },
        {
          title: 'League Stage',
          content: `${leagueMatches} league matches are played between ${numTeams} teams. The ${leagueMatches} winning teams directly qualify for the semi-finals. The losing teams get another chance in the knock-out rounds.`,
        },
        {
          title: 'Knock-Out Rounds',
          content: `${knockoutMatches} knock-out matches are played between the ${knockoutMatches * 2} teams that lost the league matches. The 1st team plays the 3rd team, and the 2nd team plays the 4th team. Winners advance to the semi-finals.`,
        },
        {
          title: 'Semi-Finals',
          content: `${semifinalMatches} semi-final matches are played between 6 winning teams. From the league qualifiers: 1st plays 3rd, and 2nd plays 4th. One additional semi-final is played between the two knock-out round winners.`,
        },
        {
          title: 'Final',
          content: `${finalMatches} final match is played between the top 2 winning teams from the ${semifinalMatches} semi-finals. However, for the Final, the number of overs may be decided based on light conditions on match day.`,
        },
      ],
    },
    {
      category: 'Qualification & Tiebreakers',
      icon: '📊',
      rules: [
        {
          title: 'Finals Qualification Criteria',
          content: `The top 2 teams from the semi-finals qualify for the final. Selection priority: (1) Net Run Rate (NRR) = (Runs scored by team / Overs faced) − (Runs scored by opposition / Overs faced by opposition). (2) Number of Boundaries (Fours and Sixes). (3) Head-to-head result — which team defeated the other.`,
        },
        {
          title: 'Net Run Rate (NRR)',
          content: 'NRR is calculated as: (Runs scored by a team / Overs faced by a team) − (Runs scored by the opposition / Overs faced by the opposition). A higher NRR indicates better performance.',
        },
        {
          title: 'Boundary Count Tiebreaker',
          content: 'If teams are tied on NRR, the team with more boundaries (Fours + Sixes) combined across their semi-final matches advances.',
        },
        {
          title: 'Head-to-Head Tiebreaker',
          content: 'If teams are still tied after NRR and boundary count, the team that defeated the other in their head-to-head encounter advances.',
        },
        {
          title: 'Super Over (Tie)',
          content: 'In case of a tie in any match, a Super Over will be played. If the Super Over is also tied, the winner is decided by the total number of boundaries hit by each team during the Super Over.',
        },
      ],
    },
    {
      category: 'Powerplay Rules',
      icon: '⚡',
      rules: [
        {
          title: `Powerplay – ${leagueOvers}-Over Matches (League, Knock-Out & Semi-Finals)`,
          content: `The ${leagueMatches + knockoutMatches + semifinalMatches} league, knock-out, and semi-final matches comprise ${leagueOvers} overs each with ${leaguePowerplayOvers} over(s) of powerplay. The 1st over is a mandatory powerplay. Maximum ${maxFieldersOutside30Yards} players are allowed outside 30 yards during powerplay overs.`,
        },
        {
          title: `Powerplay – ${finalOvers}-Over Final Match`,
          content: `The final match comprises ${finalOvers} overs with ${finalPowerplayOvers} over(s) of powerplay. The 1st over is a mandatory powerplay. The 2nd powerplay over (in the ${finalOvers}-over game) is decided by the batting side and must be taken before the ${finalOvers}th over — if not opted, the ${finalOvers}th over becomes the powerplay. Maximum ${maxFieldersOutside30Yards} players are allowed outside 30 yards during powerplay overs.`,
        },
        {
          title: 'Fielding Restrictions During Powerplay',
          content: `A maximum of ${maxFieldersOutside30Yards} players are allowed outside the 30-yard circle during powerplay overs. This restriction encourages attacking batting at the start of each innings.`,
        },
      ],
    },
    {
      category: 'Player Rules',
      icon: '🏏',
      rules: [
        {
          title: 'Batsman Ball Limit',
          content: `One batsman must be on the ground (may face the balls or not) for a maximum of ${maxBallsPerBatsmanShortFormat} legal balls in a ${leagueOvers}-over match and ${maxBallsPerBatsmanLongFormat} legal balls in a ${finalOvers}-over match. A batsman retired after ${maxBallsPerBatsmanShortFormat} or ${maxBallsPerBatsmanLongFormat} balls cannot bat again and is treated as a wicket for NRR calculations. Responsibility lies solely with the Captains and Vice Captains — a penalty of 2 runs will be deducted for any default.`,
        },
        {
          title: 'Bowler Over Limit',
          content: `In a ${leagueOvers}-over match, one bowler can bowl a maximum of ${maxOversBowlerShortFormat} over(s). Others can bowl 1 over each. In a ${finalOvers}-over match, two bowlers can bowl a maximum of ${maxOversBowlerLongFormat} over(s) each. Others can bowl 1 over each.`,
        },
        {
          title: 'Bouncer Limit',
          content: `${bouncerLimitPerOver} bouncer(s) allowed per over.`,
        },
        {
          title: 'Retired Hurt (Not Out)',
          content: 'Whenever a batsman retires due to injury, illness, or any other exceptional circumstances, they are permitted to recommence their innings at any time later during their team\'s innings, but only after the fall of a wicket.',
        },
        {
          title: 'Wide / No-Ball Bowler Change',
          content: `If any bowler bowls ${widesNoBallBowlerChangeThreshold} wides or no-balls, the bowling team's captain may change the bowler at their discretion. The runs from wides and no-balls will still be added to the score.`,
        },
      ],
    },
    {
      category: 'Penalty Rules',
      icon: '⚠️',
      rules: [
        {
          title: 'Timeout Rule',
          content: `A new batsman must reach the ground within ${timeoutDurationSeconds} second(s) of the fall of a wicket. Failure to do so results in a TIME OUT. All teams must ensure their batting order is decided well in advance.`,
        },
        {
          title: 'Team Readiness',
          content: `Teams are required to be ready ${teamReadinessPenaltyMinutes} minutes prior to their match. Any team that fails to do so shall be penalized with a deduction of a maximum of ${teamReadinessPenaltyOvers} over(s).`,
        },
        {
          title: 'Slow Over Rate Penalty',
          content: `If the fielding team does not start to bowl their ${leagueOvers}th over within ${inningsDurationMinutes} minutes in a ${leagueOvers}-over match, the batting side will be credited an extra ${slowOverRatePenaltyRuns} runs for every whole over bowled after the ${inningsDurationMinutes}-minute mark. The umpire may add more time if they believe the batting team is wasting time.`,
        },
        {
          title: 'Captain / Vice-Captain Responsibility',
          content: `Captains and Vice Captains must ensure all rules are followed. In case of any default, the team will be penalized by ${defaultPenaltyRuns} runs.`,
        },
        ...(config.lbwApplicable
          ? [
              {
                title: 'LBW (Leg Before Wicket)',
                content: 'LBW is applicable in this tournament. A batsman is out LBW when the ball hits their body (not the bat) and the umpire judges it would have gone on to hit the stumps.',
              },
            ]
          : []),
        ...(config.freeHitApplicable
          ? [
              {
                title: 'Free Hit',
                content: 'Free Hit is applicable in this tournament. After a no-ball (for overstepping the crease), the next delivery is a free hit. The batsman cannot be dismissed except by run-out, hit the ball twice, or obstructing the field.',
              },
            ]
          : []),
      ],
    },
    {
      category: 'General Rules',
      icon: '📋',
      rules: [
        {
          title: 'Inning Duration',
          content: `Maximum inning duration is ${inningsDurationMinutes} minutes for a ${leagueOvers}-over game.`,
        },
        {
          title: 'Cricket Kits',
          content: 'Teams can bring their cricket kits for self-practice.',
        },
        {
          title: 'Umpire Decisions',
          content: 'All teams must follow the decisions of the officiating umpires during their respective matches. Umpire decisions are final.',
        },
        {
          title: 'Additional Rules',
          content: 'Other rules and regulations of the match will be communicated to the team captains on the ground.',
        },
      ],
    },
  ];
}
