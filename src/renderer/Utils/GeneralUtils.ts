import { Dayjs } from 'dayjs';

/** Disallow creating teams with more than this many players on the roster */
export const MAX_PLAYERS_PER_TEAM = 30;

/**
 * Did this field's value change such that we should prompt the user to save?
 * Changing nullish to empty string doesn't count.
 */
export function textFieldChanged(oldVal: string, newVal: string): boolean {
  if ((oldVal === undefined || oldVal === null) && newVal === '') {
    return false;
  }
  return oldVal !== newVal;
}

/** Did this field's value change such that we should prompt the user to save? */
export function dateFieldChanged(oldVal: Dayjs | null, newVal: Dayjs | null): boolean {
  if (oldVal === null && newVal === null) {
    return false;
  }
  if (oldVal === null || newVal === null) {
    return true;
  }
  return oldVal.unix() !== newVal.unix();
}

/** Is this string an integer within the given bounds? (Empty string is valid) */
export function invalidInteger(str: string, lowerBound?: number, upperBound?: number) {
  if (str === '') return false;
  const int = parseInt(str, 10);
  if (Number.isNaN(int)) return true;
  if (parseFloat(str) % 1) return true;
  if (lowerBound !== undefined && int < lowerBound) return true;
  if (upperBound !== undefined && int > upperBound) return true;
  return false;
}

/** Unicode/ASCII code for uppercase 'A' */
const unicodeA = 65;

/** Unicode/ASCII code for uppercase 'Z' */
const unicodeZ = 90;

/** Get the nth letter of the alphabet (uppercase) */
export function getAlphabetLetter(num: number) {
  return String.fromCharCode(unicodeA + num - 1);
}

export function nextAlphabetLetter(char: string) {
  if (!isNormalTeamLetter(char)) return '';
  if (char === 'Z') return '';
  return String.fromCharCode(char.charCodeAt(0) + 1);
}

/** Split team name into org name + letter if possible, e.g. "Riverview A" -> ["Riverview", "A"] */
export function teamGetNameAndLetter(rawName: string): [string, string] {
  const lastIdx = rawName.length - 1;
  const penultimate = rawName.charAt(lastIdx - 1);
  if (penultimate !== ' ') {
    return [rawName, ''];
  }
  const letter = rawName.substring(lastIdx).toLocaleUpperCase();
  if (!isNormalTeamLetter(letter)) {
    return [rawName, ''];
  }
  const orgName = rawName.substring(0, lastIdx).trim();
  return [orgName, letter];
}

/** Is this a normal team designator? (A, B, C, etc.) */
export function isNormalTeamLetter(letter: string) {
  if (letter.length !== 1) return false;
  const ascii = letter.charCodeAt(0);
  return ascii >= unicodeA && ascii <= unicodeZ;
}

/**
 * Is version a less than version b? Versions are 3-piece dot-delimited, e.g. '1.2.3'
 * @param  a    version string
 * @param  b    version string
 * @param  type precision to use for the comparison. Default: 'patch' (third piece)
 * @return      true if a is less than b
 */
export function versionLt(a: string, b: string, type?: 'major' | 'minor' | 'patch'): boolean {
  const aSplit = a.split('.');
  const bSplit = b.split('.');
  if (aSplit[0] !== bSplit[0]) {
    return aSplit[0] < bSplit[0];
  }
  if (type === 'major') {
    return false;
  }
  if (aSplit[1] !== bSplit[1]) {
    return aSplit[1] < bSplit[1];
  }
  if (type === 'minor') {
    return false;
  }
  return aSplit[2] < bSplit[2];
}
