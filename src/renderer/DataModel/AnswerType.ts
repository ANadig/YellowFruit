import { IQbjObject } from './Interfaces';

/** Represents a certain way a tossup can be answered. Corresponds with qb schema object
 *  https://schema.quizbowl.technology/tournament
 */
export interface IQbjAnswerType extends IQbjObject {
  /** The number of points a player receives for this answer type. */
  value: number;
  /** How to label the answer type on reports */
  label?: string;
  /** Abbreviated label  */
  shortLabel?: string;
  /** Whether or not the team that gets this answer value will next receive a bonus question */
  awardsBonus?: boolean;
}

/** YellowFruit implementation of the AnswerType object */
class AnswerType implements IQbjAnswerType {
  value: number;

  private _label: string | undefined;

  get label(): string {
    return this._label ? this._label : this.value.toString();
  }

  set label(str) {
    this._label = str;
  }

  private _shortLabel: string | undefined;

  get shortLabel(): string {
    return this._shortLabel ? this._shortLabel : this.label;
  }

  set shortLabel(str) {
    this._shortLabel = str;
  }

  get awardsBonus(): boolean {
    return this.value > 0;
  }

  constructor(points: number) {
    this.value = points;
  }
}

export default AnswerType;
