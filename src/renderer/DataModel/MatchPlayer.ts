import AnswerType from './AnswerType';
import Player from './Player';

/** How many times in a game one player scored one specific point value */
interface IPlayerAnswerCount {
  /** Number of questions answered for this many points */
  number: number;
  answerType: AnswerType;
}

/** One player's performance in one game */
class MatchPlayer {
  /** Which player this is referring to */
  player: Player;

  /** The number of tossups this player heard */
  tossupsHeard: number = 0;

  /** The number of this player's answers for each answer value */
  answerCounts: IPlayerAnswerCount[];

  /** total points for this player */
  get points(): number {
    let total = 0;
    for (const a of this.answerCounts) {
      total += a.number * a.answerType.value;
    }
    return total;
  }

  constructor(p: Player) {
    this.player = p;
    this.answerCounts = [];
  }
}

export default MatchPlayer;
