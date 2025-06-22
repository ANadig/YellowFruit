import { expect, test } from 'vitest';
import { Team } from '../renderer/DataModel/Team';
import Registration from '../renderer/DataModel/Registration';

test('computeLettersAndRegName01', () => {
  const teamA = new Team('Washington A');
  const reg = new Registration('test', teamA);

  reg.computeLettersAndRegName();

  expect(reg.name).toBe('Washington');
  expect(teamA.letter).toBe('A');
});

test('computeLettersAndRegName02', () => {
  const teamA = new Team('Washington A');
  const teamB = new Team('Washington B');
  const reg = new Registration('test');
  reg.addTeam(teamA);
  reg.addTeam(teamB);

  reg.computeLettersAndRegName();

  expect(reg.name).toBe('Washington');
  expect(teamA.letter).toBe('A');
  expect(teamB.letter).toBe('B');
});

test('computeLettersAndRegName03', () => {
  const teamA = new Team('Washington A');
  const teamB = new Team('Adams B');
  const reg = new Registration('test');
  reg.addTeam(teamA);
  reg.addTeam(teamB);

  reg.computeLettersAndRegName();

  expect(reg.name).toBe('test');
  expect(teamA.letter).toBe('A');
  expect(teamB.letter).toBe('B');
});

test('computeLettersAndRegName04', () => {
  const teamA = new Team('Washington');
  const teamB = new Team('Washington B');
  const reg = new Registration('test');
  reg.addTeam(teamA);
  reg.addTeam(teamB);

  reg.computeLettersAndRegName();

  expect(reg.name).toBe('Washington');
  expect(teamA.letter).toBe('');
  expect(teamB.letter).toBe('B');
});
