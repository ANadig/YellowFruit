/**
 * Classes representing how teams and rounds are grouped
 * Corresponds with qb schema objects
 * https://schema.quizbowl.technology/phase
 */

import { Match } from '@testing-library/react';
import Team from './Team';

/** A single team's assignment to a single pool */
interface IPoolTeam {
  team: Team;
  /** The final position/rank of this Team within this Pool */
  position: number;
}

/** A group of teams, e.g. a single prelim bracket */
interface IPool {
  /** name of the pool */
  name: string;
  /** Further info about the pool */
  description: string;
  /** The position/rank of this Pool among all Pool
   * objects used for its Phase. Need not be unique (e.g. in the case of parallel pools) */
  position: number;
  /** The assignments of teams to pools for this phase */
  poolTeams: IPoolTeam[];
}

/** A packet of questions. YF only supports storing packet names, not any information about the
 * questions in them.
 */
interface IPacket {
  name: string;
}

/** One round of games */
class Round {
  /** In YF everything should have a numerical round even though this isn't in the schema */
  number?: number;

  private _name?: string;

  /** The name of the round */
  get name(): string {
    return this._name ? this._name : `Round ${this.number}`;
  }

  set name(str) {
    this._name = str;
  }

  /** Further information about this round if needed */
  description?: string;

  /** Packet used for the round. YF only supports one packet per round. */
  packet?: IPacket;

  /** The matches that took place in this round */
  matches?: Match[];
}

interface IPhase {
  /** The name of the phase, such as "Preliminary Rounds" or "Playoffs" */
  name: string;
  /** A description of the phase. Might contain information like how teams are split into pools, etc */
  description: string;
  /** Rounds this phase encompasses */
  rounds: Round[];
  /** Pools teams are grouped into for this phase */
  pools: IPool[];
}

export default IPhase;
