import { expect, test } from 'vitest';
import {
  collectRefTargets,
  collectRefTargetsScoringRules,
  collectRefTargetsTournament,
  getBaseQbjObject,
  isQbjRefPointer,
  makeQbjRefPointer,
} from '../renderer/DataModel/QbjUtils';
import { IQbjTournamentSite, TournamentSite } from '../renderer/DataModel/TournamentSite';
import { IIndeterminateQbj } from '../renderer/DataModel/Interfaces';
import { QbjTypeNames } from '../renderer/DataModel/QbjEnums';
import { IQbjScoringRules } from '../renderer/DataModel/ScoringRules';
import { IQbjTournament } from '../renderer/DataModel/Tournament';

test('isQbjRefPointer01', () => {
  const obj = { $ref: 'someId' };
  expect(isQbjRefPointer(obj)).toBeTruthy();
});

test('isQbjRefPointer02', () => {
  const obj = new TournamentSite().toQbjObject();
  expect(isQbjRefPointer(obj as IIndeterminateQbj)).toBeFalsy();
});

test('makeAndTestQbjRefPointer', () => {
  const obj = makeQbjRefPointer('someId');
  expect(isQbjRefPointer(obj)).toBeTruthy();
});

/** return the passed-in object */
test('getBaseQbjObject01', () => {
  const obj = { name: 'myname' };
  expect(getBaseQbjObject(obj as IIndeterminateQbj, {})).toMatchObject(obj);
});

/** resolve the $ref */
test('getBaseQbjObject02', () => {
  const refId = 'index01';
  const refTarget: IQbjTournamentSite = { id: refId, name: 'myname' };
  const refDict = { [refId]: refTarget };
  const obj = makeQbjRefPointer(refId);
  expect(getBaseQbjObject(obj as IIndeterminateQbj, refDict)).toMatchObject(refTarget);
});

/** missing ref */
test('getBaseQbjObject03', () => {
  const refId = 'index01';
  const refTarget: IQbjTournamentSite = { id: refId, name: 'myname' };
  const refDict = { someOtherId: refTarget };
  const obj = makeQbjRefPointer(refId);
  expect(getBaseQbjObject(obj as IIndeterminateQbj, refDict)).toBeNull();
});

test('collectRefTargets01', () => {
  const tsite = { type: QbjTypeNames.TournamentSite, id: 'TournamentSite01', name: 'siteName' };
  const objectList = [];
  objectList.push({ type: QbjTypeNames.Tournament, name: 'myTournament' });
  objectList.push(tsite);

  const expectedDict = { TournamentSite01: tsite };
  const dict = collectRefTargets(objectList);
  expect(dict).toMatchObject(expectedDict);
});

test('collectRefTargets02', () => {
  const aTypeTen = { value: 10, id: 'atype_ten' };
  const aTypes = [aTypeTen];
  const rules: IQbjScoringRules = { type: QbjTypeNames.ScoringRules, name: 'therules', answerTypes: aTypes };

  const expectedDict = { atype_ten: aTypeTen };
  const dict = collectRefTargets([rules]);
  expect(dict).toMatchObject(expectedDict);
});

test('collectRefTargetsTournament01', () => {
  const aTypeTen = { value: 10, id: 'atype_ten' };
  const rules: IQbjScoringRules = { name: 'therules', answerTypes: [aTypeTen] };
  const site: IQbjTournamentSite = { id: 'tsite', name: 'sitename' };
  const tourn: IQbjTournament = { name: 'tname', scoringRules: rules, tournamentSite: site };

  const expectedDict = { atype_ten: aTypeTen, tsite: site };
  const dict = collectRefTargetsTournament(tourn);
  expect(dict).toMatchObject(expectedDict);
});

test('collectRefTargetsScoringRules01', () => {
  const aTypeTen = { value: 10, id: 'atype_ten' };
  const aTypes = [aTypeTen];
  const rules: IQbjScoringRules = { name: 'therules', answerTypes: aTypes };

  const expectedDict = { atype_ten: aTypeTen };
  const dict = collectRefTargetsScoringRules(rules);
  expect(dict).toMatchObject(expectedDict);
});
