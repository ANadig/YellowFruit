import { expect, test } from 'vitest';
import { TournamentSite } from '../renderer/DataModel/TournamentSite';
import { QbjTypeNames } from '../renderer/DataModel/QbjEnums';

test('toQbjObject01', () => {
  const tsite = new TournamentSite();
  const qbjObj = tsite.toQbjObject();

  expect(qbjObj.name).toBe(TournamentSite.placeHolderName);
  expect(qbjObj.type).toBeUndefined();
  expect(qbjObj.id).toBeUndefined();
});

test('toQbjObject02', () => {
  const tsite = new TournamentSite();
  const name = 'my house';
  tsite.name = name;

  const qbjObj = tsite.toQbjObject();

  expect(qbjObj.name).toBe(name);
});

test('toQbjObject03', () => {
  const tsite = new TournamentSite();
  const qbjObj = tsite.toQbjObject(true);

  expect(qbjObj.type).toBe(QbjTypeNames.TournamentSite);
  expect(qbjObj.id).toBeUndefined();
});

test('toQbjObject04', () => {
  const tsite = new TournamentSite();
  const name = 'my house';
  tsite.name = name;

  const qbjObj = tsite.toQbjObject(false, true);

  expect(qbjObj.type).toBeUndefined();
  expect(qbjObj.id).toBe(`TournamentSite_${name}`);
});

test('toYftFileObject01', () => {
  const tsite = new TournamentSite();
  const name = 'my house';
  tsite.name = name;

  const yftFIleObj = tsite.toYftFileObject();

  expect(yftFIleObj.name).toBe(name);
  expect(yftFIleObj.type).toBeUndefined();
  expect(yftFIleObj.id).toBeUndefined();
});
