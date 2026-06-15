import { expect, test } from 'vitest';
import { Player, PlayerYear } from '../renderer/DataModel/Player';

test('answerType01', () => {
  expect(Player.getPlayerNameFromId('Player_John Smith_1234')).toBe('John Smith');
});

test('year01', () => {
  const p = new Player('player name');
  p.yearString = 'Soph.';

  expect(p.year).toBe(PlayerYear.CollSophomore);
});

test('year02', () => {
  const p = new Player('player name');
  p.yearString = '5th grade';

  expect(p.year).toBe(PlayerYear.Grade5);
});

test('year03', () => {
  const p = new Player('player name');
  p.yearString = '5Sr.';

  expect(p.year).toBe(PlayerYear.CollPostSenior);
});
