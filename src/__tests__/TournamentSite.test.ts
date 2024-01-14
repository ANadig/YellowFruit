import { expect, test } from 'vitest';
import { TournamentSite } from '../renderer/DataModel/TournamentSite';
import { QbjTypeNames } from '../renderer/DataModel/QbjEnums';

test('toQbjObject01', () => {
  const tsite = new TournamentSite();
  const qbjObj = tsite.toFileObject(true);

  expect(qbjObj.name).toBe(TournamentSite.placeHolderName);
  expect(qbjObj.type).toBeUndefined();
  expect(qbjObj.id).toBeUndefined();
});

test('toQbjObject02', () => {
  const tsite = new TournamentSite();
  const name = 'my house';
  tsite.name = name;

  const qbjObj = tsite.toFileObject(true);

  expect(qbjObj.name).toBe(name);
});

test('toQbjObject03', () => {
  const tsite = new TournamentSite();
  const qbjObj = tsite.toFileObject(true, true);

  expect(qbjObj.type).toBe(QbjTypeNames.TournamentSite);
  expect(qbjObj.id).toBeUndefined();
});

test('toQbjObject04', () => {
  const tsite = new TournamentSite();
  const name = 'my house';
  tsite.name = name;

  const qbjObj = tsite.toFileObject(true, false, true);

  expect(qbjObj.type).toBeUndefined();
  expect(qbjObj.id).toBe(`TournamentSite_${name}`);
});

test('toYftFileObject01', () => {
  const tsite = new TournamentSite();
  const name = 'my house';
  tsite.name = name;

  const yftFIleObj = tsite.toFileObject(false);

  expect(yftFIleObj.name).toBe(name);
  expect(yftFIleObj.type).toBeUndefined();
  expect(yftFIleObj.id).toBeUndefined();
});
