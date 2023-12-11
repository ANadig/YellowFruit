import { Dayjs } from 'dayjs';

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
