/**
 * Adapter from YellowFruit's ScoringRules to MODAQ's IGameFormat.
 *
 * These two models overlap but are not the same, and several YellowFruit settings simply have no
 * representation in MODAQ. Rather than guessing (which would silently mis-score real games), this
 * module returns explicit errors for configurations it can't translate, and the caller is expected
 * to refuse to start a room game until the tournament's rules are something MODAQ can handle.
 *
 * Things MODAQ's IGameFormat cannot express, verified against modaq 1.41.1:
 *  - A base (non-power, non-neg) tossup value other than 10. PacketState.getPointsAtPosition
 *    hardcodes 10 for any correct buzz outside of power.
 *  - Lightning rounds. There is no such concept in MODAQ.
 *  - More than one neg value. IGameFormat has a single `negValue`.
 *  - Irregular bonuses. Bonus part values in MODAQ come from the packet, not the game format, and
 *    since YellowFruit doesn't serve packets to rooms, MODAQ falls back to its standard 3-part,
 *    10-points-per-part bonus.
 */
import { ScoringRules } from '../DataModel/ScoringRules';

/**
 * Structural copy of MODAQ's `IGameFormat` (modaq 1.41.1).
 *
 * Declared locally on purpose: the Electron renderer must not import `modaq`, which would pull
 * Fluent UI and a second copy of React into the desktop bundle. The room bundle, which does depend
 * on modaq, asserts this type is assignable to the real one.
 */
export interface IModaqGameFormat {
  regulationTossupCount: number;
  minimumOvertimeQuestionCount: number;
  overtimeIncludesBonuses: boolean;
  bonusesBounceBack: boolean;
  negValue: number;
  pairTossupsBonuses: boolean;
  powers: IModaqPowerMarker[];
  timeoutsAllowed: number;
  displayName: string;
  pronunciationGuideMarkers?: [string, string];
  version: string;
}

export interface IModaqPowerMarker {
  marker: string;
  points: number;
}

/**
 * MODAQ's game format schema version, from GameFormats.ts in modaq 1.41.1. MODAQ upgrades formats
 * whose version doesn't match, so this must stay in sync with the installed MODAQ.
 */
export const modaqGameFormatVersion = '2024-03-20';

/** MODAQ's default markers for pronunciation guides */
export const modaqDefaultPronunciationGuideMarkers: [string, string] = ['("', '")'];

/** The only base tossup value MODAQ supports; see PacketState.getPointsAtPosition */
export const modaqBaseTossupValue = 10;

/** MODAQ's implicit bonus shape when no packet is supplied */
const modaqImplicitBonusPartCount = 3;
const modaqImplicitPointsPerBonusPart = 10;

/**
 * Power markers MODAQ recognizes, highest value first. YellowFruit only records the point value of
 * a power, not the marker used in the packet, so we assign conventional markers by value.
 */
const conventionalPowerMarkers: { points: number; marker: string }[] = [
  { points: 20, marker: '(+)' },
  { points: 15, marker: '(*)' },
];

/** Fallback marker for a power whose value isn't one of the conventional ones */
const genericPowerMarker = '(*)';

export interface IModaqFormatSuccess {
  ok: true;
  gameFormat: IModaqGameFormat;
  /**
   * Things that were translated but imperfectly. Not fatal, but the statskeeper should know.
   */
  warnings: string[];
}

export interface IModaqFormatFailure {
  ok: false;
  /** Why this configuration can't be handed to MODAQ safely */
  errors: string[];
}

export type IModaqFormatResult = IModaqFormatSuccess | IModaqFormatFailure;

/** Pick a power marker for a given point value */
function markerForPower(points: number, usedMarkers: Set<string>): string {
  const conventional = conventionalPowerMarkers.find((p) => p.points === points);
  if (conventional && !usedMarkers.has(conventional.marker)) return conventional.marker;

  // Distinguish additional power tiers by repeating the marker character, which MODAQ treats as a
  // distinct string but a reader will still recognize.
  let candidate = conventional?.marker ?? genericPowerMarker;
  while (usedMarkers.has(candidate)) {
    candidate = `(${'*'.repeat(usedMarkers.size + 1)})`;
  }
  return candidate;
}

/**
 * Translate YellowFruit scoring rules into a MODAQ game format.
 * @returns a game format, or the list of reasons the rules can't be represented in MODAQ
 */
export default function scoringRulesToModaqGameFormat(rules: ScoringRules): IModaqFormatResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const powerTypes = rules.answerTypes.filter((at) => at.isPower);
  const negTypes = rules.answerTypes.filter((at) => at.isNeg);
  const baseTypes = rules.answerTypes.filter((at) => !at.isPower && !at.isNeg);

  if (rules.answerTypes.length === 0) {
    errors.push('This tournament has no answer types defined, so there is nothing to score.');
  }

  if (baseTypes.length === 0 && rules.answerTypes.length > 0) {
    errors.push(
      `MODAQ requires a ${modaqBaseTossupValue}-point tossup value, but this tournament has no non-power, non-neg answer type.`,
    );
  } else if (baseTypes.length > 1) {
    const values = baseTypes.map((at) => at.value).join(', ');
    errors.push(`MODAQ supports one non-power tossup value, but this tournament defines several (${values} points).`);
  } else if (baseTypes.length === 1 && baseTypes[0].value !== modaqBaseTossupValue) {
    errors.push(
      `MODAQ always awards ${modaqBaseTossupValue} points for a correct tossup outside of power, but this tournament awards ${baseTypes[0].value}.`,
    );
  }

  if (negTypes.length > 1) {
    const values = negTypes.map((at) => at.value).join(', ');
    errors.push(`MODAQ supports a single neg value, but this tournament defines several (${values}).`);
  }

  if (rules.useLightningRounds()) {
    errors.push('MODAQ cannot score lightning rounds, so rooms cannot be used for this tournament.');
  }

  if (rules.useBonuses) {
    if (!rules.bonusesAreRegular()) {
      errors.push(
        'MODAQ can only score bonuses that always have the same number of parts worth the same number of points each.',
      );
    } else {
      if (rules.minimumPartsPerBonus !== modaqImplicitBonusPartCount) {
        errors.push(
          `Rooms score bonuses as ${modaqImplicitBonusPartCount} parts, but this tournament uses ${rules.minimumPartsPerBonus}-part bonuses.`,
        );
      }
      if (rules.pointsPerBonusPart !== modaqImplicitPointsPerBonusPart) {
        errors.push(
          `Rooms score bonus parts at ${modaqImplicitPointsPerBonusPart} points each, but this tournament uses ${rules.pointsPerBonusPart}.`,
        );
      }
      if (rules.maximumBonusScore !== modaqImplicitBonusPartCount * modaqImplicitPointsPerBonusPart) {
        errors.push(
          `Rooms score bonuses out of ${
            modaqImplicitBonusPartCount * modaqImplicitPointsPerBonusPart
          }, but this tournament's maximum bonus score is ${rules.maximumBonusScore}.`,
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  if (rules.timed) {
    warnings.push(
      `This tournament uses timed rounds. Rooms will be set up for ${rules.regulationTossupCount} tossups; the scorekeeper will need to stop the game when time expires.`,
    );
  }

  const usedMarkers = new Set<string>();
  const powers: IModaqPowerMarker[] = powerTypes
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((at) => {
      const marker = markerForPower(at.value, usedMarkers);
      usedMarkers.add(marker);
      return { marker, points: at.value };
    });

  if (powers.length > 0) {
    warnings.push(
      `YellowFruit doesn't record which packet marker indicates a power, so rooms will look for ${powers
        .map((p) => `${p.marker} (${p.points})`)
        .join(', ')}.`,
    );
  }

  const gameFormat: IModaqGameFormat = {
    regulationTossupCount: rules.regulationTossupCount,
    minimumOvertimeQuestionCount: rules.minimumOvertimeQuestionCount,
    overtimeIncludesBonuses: rules.overtimeIncludesBonuses,
    bonusesBounceBack: rules.bonusesBounceBack,
    // YellowFruit represents "no negs" by simply not defining a negative answer type.
    negValue: negTypes.length === 1 ? negTypes[0].value : 0,
    pairTossupsBonuses: rules.useBonuses,
    powers,
    // YellowFruit doesn't model timeouts. MODAQ's own standard formats use 1.
    timeoutsAllowed: 1,
    displayName: rules.name || 'YellowFruit tournament rules',
    pronunciationGuideMarkers: modaqDefaultPronunciationGuideMarkers,
    version: modaqGameFormatVersion,
  };

  return { ok: true, gameFormat, warnings };
}
