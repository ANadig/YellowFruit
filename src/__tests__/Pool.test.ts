import { expect, test } from 'vitest';
import { makePoolSet } from '../renderer/DataModel/Pool';

test('makePoolSet01', () => {
  const numPools = 2;
  const poolSize = 6;
  const position = 1;
  const pools = makePoolSet(numPools, poolSize, position, 'test', [2, 3, 1]);

  expect(pools.length).toBe(numPools);
  expect(pools[1].name).toBe('test 2');
  expect(pools[1].position).toBe(position);
  expect(pools[1].size).toBe(poolSize);
  expect(pools[1].autoAdvanceRules.length).toBe(3);
  expect(pools[1].autoAdvanceRules[0].tier).toBe(1);
  expect(pools[1].autoAdvanceRules[1].tier).toBe(2);
  expect(pools[1].autoAdvanceRules[2].tier).toBe(3);
  expect(pools[1].autoAdvanceRules[0].ranksThatAdvance.length).toBe(2);
  expect(pools[1].autoAdvanceRules[1].ranksThatAdvance.length).toBe(3);
  expect(pools[1].autoAdvanceRules[2].ranksThatAdvance.length).toBe(1);
  expect(pools[1].autoAdvanceRules[1].ranksThatAdvance[2]).toBe(5);
  expect(pools[1].autoAdvanceRules[2].ranksThatAdvance[0]).toBe(6);
});
