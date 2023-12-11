import { expect, test } from 'vitest';
import dayjs from 'dayjs';
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

test('setTournamentStartDate', () => {
  const mgr = new TournamentManager();
  expect(mgr.unsavedData).toBeFalsy();

  mgr.setTournamentStartDate(dayjs('2023-10-15'));
  expect(mgr.tournament.startDate?.toString()).toBe(dayjs('2023-10-15').toDate().toString());
  expect(mgr.unsavedData).toBeTruthy();

  mgr.unsavedData = false;
  mgr.setTournamentStartDate(dayjs('2023-10-15'));
  expect(mgr.unsavedData).toBeFalsy();

  mgr.setTournamentStartDate(null);
  expect(mgr.tournament.startDate).toBeNull();
  expect(mgr.unsavedData).toBeTruthy();
});
