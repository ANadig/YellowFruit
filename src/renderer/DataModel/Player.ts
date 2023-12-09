/** Grades/years in school */
enum PlayerYear {
  NotApplicable = -1,
  Kindergarten = 0,
  Grade1 = 1,
  Grade2 = 2,
  Grade3 = 3,
  Grade4 = 4,
  Grade5 = 5,
  Grade6 = 6,
  Grade7 = 7,
  Grade8 = 8,
  Grade9 = 9,
  Grade10 = 10,
  Grade11 = 11,
  Grade12 = 12,
  CollFreshman = 13,
  CollSophomore = 14,
  CollJunior = 15,
  CollSenior = 16,
  CollPostSenior = 17,
  GradStudent = 18,
}

/** A player on a single team */
class Player {
  /** The player's name */
  name?: string;

  /** Grade in school as a string. */
  yearString?: string;

  /** Grade in school, in the schema's numerical format. Is null if we can't parse to something valid */
  get year(): PlayerYear | null {
    if (!this.yearString) {
      return null;
    }
    let grade = Player.parseNonNumericYear(this.yearString);
    if (grade === null) {
      grade = parseInt(this.yearString, 10);
    }
    if (Number.isNaN(grade) || PlayerYear[grade] === undefined) {
      return null;
    }
    return grade;
  }

  static yearTitles = {
    0: 'Kindergarten',
    1: '1st Grade',
    2: '2nd Grade',
    3: '3rd Grade',
    4: '4th Grade',
    5: '5th Grade',
    6: '6th Grade',
    7: '7th Grade',
    8: '8th Grade',
    9: '9th Grade',
    10: '10th Grade',
    11: '11th Grade',
    12: '12th Grade',
    13: 'Freshman',
    14: 'Sophomore',
    15: 'Junior',
    16: 'Senior',
    17: 'Post-senior',
    18: 'Grad Student',
  };

  static yearAbbrevs = {
    0: 'K',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '10',
    11: '11',
    12: '12',
    13: 'Fr.',
    14: 'So.',
    15: 'Jr.',
    16: 'Sr.',
    17: 'Post-Sr.',
    18: 'Grad.',
  };

  /** Substrings that indicate that a value matches a non-numeric year */
  static yearSearchStr = {
    13: ['fr'],
    14: ['so'],
    15: ['ju', 'jr'],
    16: ['sen', 'sr'],
    17: ['post-s', 'post s'],
    18: ['grad'],
  };

  /** Try to find a matching non-numeric year (e.g. "Freshman") and return the
   * schema-definied numeric value. If none found, return null.
   */
  static parseNonNumericYear(text: string): number | null {
    const lcText = text.toLocaleLowerCase();
    for (const yr in this.yearSearchStr) {
      if (this._startsWithAny(lcText, this.yearSearchStr[yr as unknown as keyof typeof this.yearSearchStr])) {
        const yrInt = parseInt(yr, 10);
        if (yrInt === undefined) return null;
        return yrInt;
      }
    }
    return null;
  }

  private static _startsWithAny(text: string, ary: string[]): boolean {
    for (const s of ary) {
      if (text.startsWith(s)) {
        return true;
      }
    }
    return false;
  }
}

export default Player;
