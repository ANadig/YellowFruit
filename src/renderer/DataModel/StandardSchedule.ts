import { Phase } from './Phase';

/** A schedule that a tournament might use, detailing phases, pools, etc. */
export default interface StandardSchedule {
  /** How many teams the schedule is for */
  size: number;
  /** How many rounds (not including finals or TBs) this schedule lasts */
  rounds: number;
  /** After which rounds is there a pause for rebracketing? */
  rebracketAfter: number[];
  /** How many simultaneous rooms this schedule uses */
  rooms: number;
  /** Phase structure of the tournament */
  phases: Phase[];
}
