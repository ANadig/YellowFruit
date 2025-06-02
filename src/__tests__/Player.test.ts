import { expect, test } from 'vitest';
import { Player } from '../renderer/DataModel/Player';

test('answerType01', () => {
  expect(Player.getPlayerNameFromId('Player_John Smith_1234')).toBe('John Smith');
});
