/**
 * Builds a placeholder packet so MODAQ has something to score into.
 *
 * MODAQ creates one scoring cycle per tossup in its packet (GameState.loadPacket), and works out how
 * many points a buzz is worth from the position of the buzzed word relative to the power markers in
 * the question text (PacketState.getPointsAtPosition). With no packet at all it has zero cycles and
 * no buzzable words, so the scoresheet can't be used.
 *
 * YellowFruit deliberately doesn't store or serve question packets, so instead of question text this
 * builds a scaffold: each tossup is a short row of clickable placeholder tokens with the power
 * markers in the right places, so the scorekeeper picks a buzz value by clicking the token that
 * matches what happened. If a real packet is wanted, the scorekeeper can still load one from inside
 * MODAQ, which replaces this scaffold.
 */
import { IModaqGameFormat } from '../renderer/Services/YellowFruitScoringRulesToModaq';

/** Structural copy of MODAQ's IPacket, to avoid importing modaq from shared code */
export interface IScaffoldPacket {
  tossups: { question: string; answer: string }[];
  bonuses?: { leadin: string; parts: string[]; answers: string[]; values: number[] }[];
  name?: string;
}

/** How many tossups of overtime headroom to allow beyond regulation */
export const overtimeHeadroomTossups = 20;

/** Tokens offered in each scoring band. Enough to click comfortably, few enough to stay readable. */
const tokensPerBand = 3;

/**
 * One tossup's placeholder text.
 *
 * Power markers are laid out in descending point order, matching how MODAQ scans `format.powers`:
 * it returns the first power whose marker appears after the buzzed word, so the highest-value marker
 * has to come first for a buzz before it to score the most.
 */
function buildQuestionText(gameFormat: IModaqGameFormat): string {
  const words: string[] = [];

  // Powers are already sorted highest-value-first by the scoring rules adapter, but don't rely on
  // the caller for something this easy to get wrong.
  const powers = gameFormat.powers.slice().sort((a, b) => b.points - a.points);

  for (const power of powers) {
    for (let i = 0; i < tokensPerBand; i++) words.push(`${power.points}pts`);
    words.push(power.marker);
  }

  // Anything after the last power marker is worth MODAQ's standard 10.
  for (let i = 0; i < tokensPerBand; i++) words.push('10pts');

  // A final token to buzz on for a wrong answer at the end of the question, which MODAQ scores as 0
  // rather than a neg.
  words.push('(end)');

  return words.join(' ');
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
    tossups.push({
      question: questionText,
      answer: 'No packet loaded — click the token matching the buzz value',
    });
  }

  const packet: IScaffoldPacket = { tossups, name: 'No packet loaded' };

  if (gameFormat.pairTossupsBonuses) {
    // MODAQ takes bonus part values from the packet. The scoring rules adapter has already refused
    // any tournament whose bonuses aren't three 10-point parts, so this is safe to hardcode.
    const bonuses = [];
    for (let i = 0; i < tossupCount; i++) {
      bonuses.push({
        leadin: 'No packet loaded.',
        parts: ['Part 1', 'Part 2', 'Part 3'],
        answers: ['', '', ''],
        values: [10, 10, 10],
      });
    }
    packet.bonuses = bonuses;
  }

  return packet;
}
