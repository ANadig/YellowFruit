// eslint-disable-next-line import/no-cycle
import Tournament from './Tournament';

export enum StatTypes {
  wins,
  losses,
  ties,
  winPct,
  pointsPerXTuhTmStandings,
  tuhTmStandings,
  bonusesHrd,
  bonusPts,
  ppb,
  bbHrd,
  bbPts,
  bbPct,
  ltngPerMtch,
  lightning,
  ltngPerTmPerGm,
  wouldAdvance,
  advancedTo,
  gamesPlayed,
  tuh,
  pointsPerXTuh,
  rrPtsPerTeamPerXTuh,
  rrPowerPct,
  rrTuConvPct,
  rrNegPct,
  rrPPB,
  rrBbPct,
  rrBonusPct,
  smallSchool,
  juniorVarsity,
  undergrad,
  div2,
}

export function columnName(stat: StatTypes, tournament: Tournament) {
  switch (stat) {
    case StatTypes.wins:
      return 'W';
    case StatTypes.losses:
      return 'L';
    case StatTypes.ties:
      return 'T';
    case StatTypes.winPct:
      return 'Pct';
    case StatTypes.pointsPerXTuhTmStandings:
    case StatTypes.pointsPerXTuh:
      return `PP${tournament.scoringRules.regulationTossupCount}TUH`;
    case StatTypes.tuhTmStandings:
    case StatTypes.tuh:
      return 'TUH';
    case StatTypes.bonusesHrd:
      return 'BHrd';
    case StatTypes.bonusPts:
      return 'BPts';
    case StatTypes.ppb:
    case StatTypes.rrPPB:
      return 'PPB';
    case StatTypes.bbHrd:
      return 'BBHrd';
    case StatTypes.bbPts:
      return 'BBPts';
    case StatTypes.bbPct:
    case StatTypes.rrBbPct:
      return 'BB%';
    case StatTypes.ltngPerMtch:
      return 'Ltng/G';
    case StatTypes.lightning:
      return 'Ltng';
    case StatTypes.ltngPerTmPerGm:
      return 'Ltng/Tm/G';
    case StatTypes.wouldAdvance:
      return 'Would Advance';
    case StatTypes.advancedTo:
      return 'Advanced To';
    case StatTypes.gamesPlayed:
      return 'GP';
    case StatTypes.rrPtsPerTeamPerXTuh:
      return `Pts/Tm/${tournament.scoringRules.regulationTossupCount}TUH`;
    case StatTypes.rrPowerPct:
      return 'TU Powered';
    case StatTypes.rrTuConvPct:
      return 'TU Converted';
    case StatTypes.rrNegPct:
      return `Negs/Tm/${tournament.scoringRules.regulationTossupCount}TUH`;
    case StatTypes.rrBonusPct:
      return 'Bonus %';
    case StatTypes.smallSchool:
      return 'SS';
    case StatTypes.juniorVarsity:
      return 'JV';
    case StatTypes.undergrad:
      return 'UG';
    case StatTypes.div2:
      return 'D2';
    default:
      return '';
  }
}

export function columnTooltip(stat: StatTypes, tournament: Tournament) {
  const rules = tournament.scoringRules;
  switch (stat) {
    case StatTypes.winPct:
      return 'Win percentage';
    case StatTypes.pointsPerXTuhTmStandings:
      return pointsPerXTuhTmStandingsTooltip(tournament);
    case StatTypes.pointsPerXTuh:
      return `Points per ${rules.regulationTossupCount} tossups heard`;
    case StatTypes.tuhTmStandings:
      return rules.overtimeIncludesBonuses ? 'Tossups heard' : 'Tossups heard in regulation';
    case StatTypes.tuh:
      return 'Tossups heard';
    case StatTypes.bonusesHrd:
      return 'Bonuses heard';
    case StatTypes.bonusPts:
      return rules.bonusesBounceBack
        ? 'Points scored on bonuses (as the controlling team)'
        : 'Points scored on bonuses';
    case StatTypes.ppb:
      return rules.bonusesBounceBack ? 'Points per bonus (as the controlling team)' : 'Points per bonus';
    case StatTypes.rrPPB:
      return rules.bonusesBounceBack ? 'Average points per bonus for the controlling team' : 'Points per bonus';
    case StatTypes.bbHrd:
      return 'Bonus parts that bounced back to this team';
    case StatTypes.bbPts:
      return 'Points scored on bonus bouncebacks';
    case StatTypes.bbPct:
    case StatTypes.rrBbPct:
      return 'Percentage of bounceback bonus parts that were answered correctly';
    case StatTypes.ltngPerMtch:
      return 'Points earned from lightning rounds per game';
    case StatTypes.lightning:
      return 'Lightning round points';
    case StatTypes.ltngPerTmPerGm:
      return 'Points earned from lightning rounds per team per game';
    case StatTypes.wouldAdvance:
      return 'Level of the next stage of the tournament that the team would advance to, given the current standings';
    case StatTypes.gamesPlayed:
      return 'Games played';
    case StatTypes.rrPtsPerTeamPerXTuh:
      return `Points per team per ${tournament.scoringRules.regulationTossupCount} tossups heard`;
    case StatTypes.rrPowerPct:
      return 'Percentage of tossups powered by either team';
    case StatTypes.rrTuConvPct:
      return 'Percentage of tossups answered correctly by either team';
    case StatTypes.rrNegPct:
      return `Incorrect tossup interrupts per team per ${tournament.scoringRules.regulationTossupCount} tossups heard`;
    case StatTypes.rrBonusPct:
      return 'Percentage of bonus parts that were answered correctly either by the controlling team or on the bounceback';
    case StatTypes.smallSchool:
      return 'Small school';
    case StatTypes.juniorVarsity:
      return 'Junior varsity';
    case StatTypes.undergrad:
      return 'Undergrad';
    case StatTypes.div2:
      return 'Division 2';
    default:
      return '';
  }
}

function pointsPerXTuhTmStandingsTooltip(tournament: Tournament) {
  const stdTuCount = tournament.scoringRules.regulationTossupCount;
  if (tournament.scoringRules.overtimeIncludesBonuses) {
    return `Points per ${stdTuCount} tossups heard`;
  }
  return `Points scored in regulation per ${stdTuCount} regulation tossups heard`;
}
