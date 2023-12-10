import { expect, test } from 'vitest';
import { TournamentManager } from '../renderer/TournamentManager';

// #region setTournamentName
// basic test
test('setTournamentName01', () => {
  const mgr = new TournamentManager();
  const expected = 'abc';
  mgr.setTournamentName(expected);
  expect(mgr.tournament.name).toBe(expected);
});

// unsaved data flag
test('setTournamentName02', () => {
  const mgr = new TournamentManager();
  expect(mgr.unsavedData).toBeFalsy();

  mgr.setTournamentName('abc');
  expect(mgr.unsavedData).toBeTruthy();

  mgr.unsavedData = false;
  mgr.setTournamentName('abc');
  expect(mgr.unsavedData).toBeFalsy();
});

// trim whitspace
test('setTournamentName03', () => {
  const mgr = new TournamentManager();
  mgr.setTournamentName(' abc ');
  expect(mgr.tournament.name).toBe('abc');
});
// #endregion

// #region setTournamentLocation
// basic test + strip whitespace + unsaved data
test('setTournamentSiteName01', () => {
  const mgr = new TournamentManager();
  expect(mgr.unsavedData).toBeFalsy();

  mgr.setTournamentSiteName(' abc ');
  expect(mgr.tournament.tournamentSite.name).toBe('abc');
  expect(mgr.unsavedData).toBeTruthy();

  mgr.unsavedData = false;
  mgr.setTournamentSiteName(' abc ');
  expect(mgr.unsavedData).toBeFalsy();
});
// #endregion

// #region setQuestionSetName
test('setQuestionSetname01', () => {
  const mgr = new TournamentManager();
  expect(mgr.unsavedData).toBeFalsy();

  mgr.setQuestionSetname(' abc ');
  expect(mgr.tournament.questionSet).toBe('abc');
  expect(mgr.unsavedData).toBeTruthy();

  mgr.unsavedData = false;
  mgr.setQuestionSetname(' abc ');
  expect(mgr.unsavedData).toBeFalsy();
});
// #endregion
