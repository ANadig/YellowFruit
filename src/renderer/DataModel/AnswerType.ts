import { IQbjObject, IYftDataModelObject, IYftFileObject } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';

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

/** Answer Type object as written to a .yft file */
export interface IYftFileAnswerType extends IQbjAnswerType, IYftFileObject {}

/** YellowFruit implementation of the AnswerType object */
class AnswerType implements IQbjAnswerType, IYftDataModelObject {
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

  toFileObject(qbjOnly = false, isTopLevel = false, isReferenced = false): IQbjAnswerType {
    // only specify labels if there are overrides
    const qbjObject: IQbjAnswerType = {
      value: this.value,
      label: this._label || undefined,
      shortLabel: this._shortLabel || undefined,
    };
    if (isTopLevel) qbjObject.type = QbjTypeNames.AnswerType;
    if (isReferenced) qbjObject.id = `AnswerType_${qbjObject.value}`;
    // In YF, awards bonus iff point value is >0, so don't explicitly save that
    if (qbjOnly) qbjObject.awardsBonus = this.awardsBonus;

    return qbjObject;
  }
}

export default AnswerType;
