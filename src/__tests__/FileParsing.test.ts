import { expect, test } from 'vitest';
import { parsePlayerYear } from '../renderer/DataModel/FileParsing';

test('parsePlayerYear01', () => {
  const yr = 9;
  const expected = '9';

  expect(parsePlayerYear(yr)).toBe(expected);
});

test('parsePlayerYear02', () => {
  const yr = 13;
  const expected = 'Fr.';

  expect(parsePlayerYear(yr)).toBe(expected);
});

test('parsePlayerYear03', () => {
  const yr = 20;

  expect(parsePlayerYear(yr)).toBeUndefined();
});

test('parsePlayerYear04', () => {
  const yr = -1;

  expect(parsePlayerYear(yr)).toBe('');
});
