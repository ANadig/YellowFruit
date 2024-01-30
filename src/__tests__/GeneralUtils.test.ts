import { expect, test } from 'vitest';
import { teamGetNameAndLetter } from '../renderer/Utils/GeneralUtils';

test('teamGetNameAndLetter01', () => {
  const raw = 'West River A';
  const expected = ['West River', 'A'];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});

test('teamGetNameAndLetter02', () => {
  const raw = 'West River ?';
  const expected = ['West River ?', ''];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});

test('teamGetNameAndLetter03', () => {
  const raw = 'West River Blue';
  const expected = ['West River Blue', ''];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});

test('teamGetNameAndLetter04', () => {
  const raw = 'A';
  const expected = ['A', ''];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});

// two spaces
test('teamGetNameAndLetter05', () => {
  const raw = 'West River  A';
  const expected = ['West River', 'A'];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});

test('teamGetNameAndLetter06', () => {
  const raw = 'West River a';
  const expected = ['West River', 'A'];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});

test('teamGetNameAndLetter07', () => {
  const raw = 'West RiverA';
  const expected = ['West RiverA', ''];
  const actual = teamGetNameAndLetter(raw);

  expect(actual[0]).toBe(expected[0]);
  expect(actual[1]).toBe(expected[1]);
});
