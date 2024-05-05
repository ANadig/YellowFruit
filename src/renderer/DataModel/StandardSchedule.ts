import { Phase } from './Phase';

/** A schedule that a tournament might use, detailing phases, pools, etc. */
export default interface StandardSchedule {
  /** Description of the schedule */
  fullName: string;
  /** Shorter description for drop-down menu (omits the number of teams).
   *  Also used as the unique key for the schedule, within the set of schedules of its size */
  shortName: string;
  /** How many teams the schedule is for */
  size: number;
  /** How many rounds (typically not including finals or TBs) this schedule lasts */
  rounds: number;
  /** All teams get at least this many games */
  minGames: number;
  /** After which rounds is there a pause for rebracketing? */
  rebracketAfter: number[];
  /** How many simultaneous rooms this schedule uses */
  rooms: number;
  /** Phase structure of the tournament */
  constructPhases: () => Phase[];
}
