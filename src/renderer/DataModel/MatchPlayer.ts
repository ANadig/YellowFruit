import { IQbjObject, IQbjRefPointer, IYftDataModelObject } from './Interfaces';
import { Player, IQbjPlayer } from './Player';
import { IQbjPlayerAnswerCount, TossupAnswerCount } from './PlayerAnswerCount';

export interface IQbjMatchPlayer extends IQbjObject {
  /** Which player this is referring to */
  player: IQbjPlayer | IQbjRefPointer;
  /** The number of tossups this player heard */
  tossupsHeard: number;
  /** The number of this player's answers for each answer value */
  answerCounts: IQbjPlayerAnswerCount[];
}

/** One player's performance in one game */
export class MatchPlayer implements IQbjMatchPlayer, IYftDataModelObject {
  player: Player;

  tossupsHeard: number = 0;

  answerCounts: TossupAnswerCount[] = [];

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
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjMatchPlayer {
    const qbjObject: IQbjMatchPlayer = {
      player: this.player.toRefPointer(),
      tossupsHeard: this.tossupsHeard,
      answerCounts: this.answerCounts.map((ac) => ac.toFileObject(qbjOnly)),
    };

    // this should not be a top-level or referenced object
    return qbjObject;
  }
}

export default MatchPlayer;
