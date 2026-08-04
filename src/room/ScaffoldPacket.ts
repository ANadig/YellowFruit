/**
 * Builds the structural packet MODAQ needs in order to work as a digital scoresheet.
 *
 * # Why a packet has to exist at all
 *
 * MODAQ creates one scoring cycle per tossup in its packet (`GameState.loadPacket`), and it works out
 * what a buzz is worth from where the buzzed *word* sits relative to the power markers in the
 * question text (`PacketState.getPointsAtPosition`). With no packet it has no cycles and no buzzable
 * words, so the scoresheet cannot be used at all.
 *
 * YellowFruit deliberately doesn't store or serve question packets. So instead of question text, each
 * tossup is a short row of scoring bands: the scorekeeper clicks the band matching what happened.
 * This is a scoresheet control, not a packet, and the room UI says so — the questions are being read
 * by a person from paper or another device.
 *
 * The tokens are written to read as a value scale rather than as prose, because a row that looks like
 * sentence fragments invites a scorekeeper to think YellowFruit has the packet and is showing it
 * badly. A real packet can still be loaded from inside MODAQ, which replaces this entirely.
 */
import { IModaqGameFormat } from '../renderer/Services/YellowFruitScoringRulesToModaq';

/** Structural copy of MODAQ's IPacket, to avoid importing modaq from shared code */
export interface IScaffoldPacket {
  tossups: { question: string; answer: string }[];
  bonuses?: { leadin: string; parts: string[]; answers: string[]; values: number[] }[];
  name?: string;
}

/**
 * How many tossups of overtime headroom to allow beyond regulation.
 *
 * MODAQ can't be given more cycles once a game is under way (`packet` is documented as set-once), so
 * the headroom has to cover the longest overtime anyone will realistically play. It is also why
 * `QbjMatchNormalizer` exists: MODAQ counts questions from the packet's length, so this padding has
 * to be subtracted back out of the exported result.
 */
export const overtimeHeadroomTossups = 20;

/** Clickable positions offered in each scoring band */
const tokensPerBand = 3;

/** What a scorekeeper clicks for a correct answer outside power. MODAQ hardcodes 10 there. */
const baseTokenLabel = '10';

/** Clicked for a wrong answer at the very end of a question, which MODAQ scores as 0 rather than a neg */
const endToken = 'no-buzz';

/** The name shown wherever MODAQ would name the packet */
export const scaffoldPacketName = 'Scoresheet — questions read externally';

/** Text on the answer line, which MODAQ shows to the scorekeeper */
const scaffoldAnswerText = 'Questions are read externally. Click the value band matching the buzz.';

/**
 * One tossup's scoring bands.
 *
 * Power markers are laid out in descending point order because that's how MODAQ scans
 * `format.powers`: it returns the first power whose marker appears after the buzzed word, so the
 * highest-value marker has to come first for an early buzz to score the most.
 */
function buildQuestionText(gameFormat: IModaqGameFormat): string {
  const words: string[] = [];

  // Already sorted highest-first by the scoring rules adapter, but this is too easy to get wrong to
  // rely on the caller for.
  const powers = gameFormat.powers.slice().sort((a, b) => b.points - a.points);

  for (const power of powers) {
    for (let i = 0; i < tokensPerBand; i++) words.push(String(power.points));
    words.push(power.marker);
  }

  for (let i = 0; i < tokensPerBand; i++) words.push(baseTokenLabel);

  words.push(endToken);

  return words.join(' ');
}

/**
 * A human-readable description of the bands, for the room's own header.
 *
 * The scorekeeper needs to know what they're clicking, and saying it once in YellowFruit's own UI is
 * clearer than trying to make MODAQ's question line explain itself.
 */
export function describeScoringBands(gameFormat: IModaqGameFormat): string {
  const powers = gameFormat.powers.slice().sort((a, b) => b.points - a.points);
  const bands = powers.map((power) => `${power.points} for a buzz before ${power.marker}`);
  bands.push(`${baseTokenLabel} after it`);
  if (gameFormat.negValue !== 0) bands.push(`${gameFormat.negValue} for an early wrong answer`);
  bands.push(`click "${endToken}" for a wrong answer at the end`);
  return bands.join(' · ');
}

/**
 * A packet with enough cycles for a full game plus overtime.
 * @param gameFormat the MODAQ format this room is using
 */
export default function buildScaffoldPacket(gameFormat: IModaqGameFormat): IScaffoldPacket {
  const tossupCount = Math.max(1, gameFormat.regulationTossupCount) + overtimeHeadroomTossups;
  const questionText = buildQuestionText(gameFormat);

  const tossups = [];
  for (let i = 0; i < tossupCount; i++) {
    tossups.push({ question: questionText, answer: scaffoldAnswerText });
  }

  const packet: IScaffoldPacket = { tossups, name: scaffoldPacketName };

  if (gameFormat.pairTossupsBonuses) {
    // MODAQ takes bonus part values from the packet. The scoring rules adapter has already refused
    // any tournament whose bonuses aren't three 10-point parts, so this is safe to hardcode.
    const bonuses = [];
    for (let i = 0; i < tossupCount; i++) {
      bonuses.push({
        leadin: 'Bonus read externally.',
        parts: ['Part 1', 'Part 2', 'Part 3'],
        answers: ['', '', ''],
        values: [10, 10, 10],
      });
    }
    packet.bonuses = bonuses;
  }

  return packet;
}
