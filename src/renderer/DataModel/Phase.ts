// eslint-disable-next-line import/no-cycle
import { Round } from './Round';
import { IQbjObject, IYftDataModelObject } from './Interfaces';
import { IQbjPool } from './Pool';
import { QbjTypeNames } from './QbjEnums';

enum PhaseTypes {
  /** The first phase of a tournament */
  Prelim,
  /** Subsequent main phases after the prelim phase  */
  Playoff,
  /** Used for determining the top several ranks */
  Finals,
  /** For breaking ties for advancing from one phase to another */
  Tiebreaker,
}

export interface IQbjPhase extends IQbjObject {
  /** The name of the phase, such as "Preliminary Rounds" or "Playoffs" */
  name: string;
  /** A description of the phase. Might contain information like how teams are split into pools, etc */
  description?: string;
  /** Rounds this phase encompasses */
  rounds?: Round[];
  /** Pools teams are grouped into for this phase */
  pools?: IQbjPool[];
  /** Whether teams may trade cards during this phase */
  cardsTraded?: boolean;
}

export class Phase implements IQbjPhase, IYftDataModelObject {
  name: string = '';

  /** Is this phase prelims, playoffs, etc */
  phaseType: PhaseTypes;

  /** Code to help users understand the order of phases: 1, 2, 2A, etc. */
  code: string = '';

  /** The number of tiers. Should be consistent with the position property of the pools in this phase */
  tiers: number = 1;

  rounds: Round[];

  constructor(type: PhaseTypes, firstRound: number, lastRound: number) {
    this.phaseType = type;
    this.rounds = [];
    for (let i = firstRound; i <= lastRound; i++) {
      this.rounds.push(new Round(i));
    }
  }

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjPhase {
    const qbjObject: IQbjPhase = {
      name: this.name,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.Phase;
    if (isReferenced) qbjObject.id = `Phase_${this.name}`;

    return qbjObject;
  }
}
