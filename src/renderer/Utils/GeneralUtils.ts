import { Dayjs } from 'dayjs';
import AnswerType from '../DataModel/AnswerType';

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

/** Sort a list of answer types. Descending order of point value, meaning powers first, negs last */
export function sortAnswerTypes(ary: AnswerType[]) {
  ary.sort((a, b) => b.value - a.value);
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
