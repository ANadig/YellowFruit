/** Dummy object representing a lack of a date */
export class NullDate extends Date {
  static nullStr = 'Yft Null Date';

  static isNullDate(d: Date): boolean {
    return d.toString() === NullDate.nullStr;
  }

  // eslint-disable-next-line class-methods-use-this
  toString(): string {
    return NullDate.nullStr;
  }
}

export class NullObjects {
  static nullDate = new NullDate();
}
