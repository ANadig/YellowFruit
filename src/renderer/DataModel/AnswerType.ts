/** Represents a certain way a tossup can be answered
 *  Corresponds with qb schema objects
 *  https://schema.quizbowl.technology/tournament
 */
class AnswerType {
  /** The number of points a player receives for this answer type. */
  value: number;

  private _label: string | undefined;

  /** How to label the answer type on reports */
  get label(): string {
    return this._label ? this._label : this.value.toString();
  }

  set label(str) {
    this._label = str;
  }

  private _shortLabel: string | undefined;

  /** Abbreviated label  */
  get shortLabel(): string {
    return this._shortLabel ? this._shortLabel : this.label;
  }

  set shortLabel(str) {
    this._shortLabel = str;
  }

  /** Whether or not the team that gets this answer value will next receive a bonus question */
  get awardsBonus(): boolean {
    return this.value > 0;
  }

  constructor(points: number) {
    this.value = points;
  }
}

export default AnswerType;
