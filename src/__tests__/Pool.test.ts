import { expect, test } from 'vitest';
import { makePoolSet, seedOneRow, snakeSeed } from '../renderer/DataModel/Pool';

test('makePoolSet01', () => {
  const numPools = 2;
  const poolSize = 6;
  const position = 1;
  const pools = makePoolSet(numPools, poolSize, position, 'test ', [2, 3, 1], true);

  expect(pools.length).toBe(numPools);
  expect(pools[1].name).toBe('test B');
  expect(pools[1].position).toBe(position);
  expect(pools[1].hasCarryover).toBeTruthy();
  expect(pools[1].size).toBe(poolSize);
  expect(pools[1].autoAdvanceRules.length).toBe(3);
  expect(pools[1].autoAdvanceRules[0].tier).toBe(1);
  expect(pools[1].autoAdvanceRules[1].tier).toBe(2);
  expect(pools[1].autoAdvanceRules[2].tier).toBe(3);
  expect(pools[1].autoAdvanceRules[0].ranksThatAdvance.length).toBe(2);
  expect(pools[1].autoAdvanceRules[1].ranksThatAdvance.length).toBe(3);
  expect(pools[1].autoAdvanceRules[2].ranksThatAdvance.length).toBe(1);
  expect(pools[1].autoAdvanceRules[1].ranksThatAdvance).toMatchObject([3, 4, 5]);
  expect(pools[1].autoAdvanceRules[2].ranksThatAdvance).toMatchObject([6]);
});

test('makePoolSet02', () => {
  const numPools = 2;
  const poolSize = 6;
  const position = 1;
  const pools = makePoolSet(numPools, poolSize, position, 'test ', [0, 3, 3], true);

  expect(pools[1].autoAdvanceRules[0].tier).toBe(2);
  expect(pools[1].autoAdvanceRules[1].tier).toBe(3);
  expect(pools[1].autoAdvanceRules[0].ranksThatAdvance).toMatchObject([1, 2, 3]);
  expect(pools[1].autoAdvanceRules[1].ranksThatAdvance).toMatchObject([4, 5, 6]);
});

test('seedOneRow01', () => {
  const pools = makePoolSet(3, 6, 1, 'test', []);
  seedOneRow(pools, 1, 18, 1);

  expect(pools[0].seeds[0]).toBe(1);
  expect(pools[1].seeds[0]).toBe(2);
  expect(pools[2].seeds[0]).toBe(3);
  expect(pools[0].seeds.length).toBe(1);
});

test('seedOneRow02', () => {
  const pools = makePoolSet(3, 6, 1, 'test', []);
  seedOneRow(pools, 1, 18, -1);

  expect(pools[0].seeds[0]).toBe(3);
  expect(pools[1].seeds[0]).toBe(2);
  expect(pools[2].seeds[0]).toBe(1);
  expect(pools[0].seeds.length).toBe(1);
});

test('seedOneRow03', () => {
  const pools = makePoolSet(3, 6, 1, 'test', []);
  seedOneRow(pools, 1, 2, 1);

  expect(pools[0].seeds[0]).toBe(1);
  expect(pools[1].seeds[0]).toBe(2);
  expect(pools[2].seeds[0]).toBeUndefined();
  expect(pools[0].seeds.length).toBe(1);
});

test('snakeSeed01', () => {
  const pools = makePoolSet(3, 6, 1, 'test', []);
  snakeSeed(pools, 1, 18);

  expect(pools[0].seeds.length).toBe(6);
  expect(pools[1].seeds.length).toBe(6);
  expect(pools[2].seeds.length).toBe(6);

  expect(pools[0].seeds).toMatchObject([1, 6, 7, 12, 13, 18]);
  expect(pools[1].seeds).toMatchObject([2, 5, 8, 11, 14, 17]);
  expect(pools[2].seeds).toMatchObject([3, 4, 9, 10, 15, 16]);
});

test('snakeSeed02', () => {
  const pools = makePoolSet(3, 6, 1, 'test', []);
  snakeSeed(pools, 1, 17);

  expect(pools[0].seeds.length).toBe(5);
  expect(pools[1].seeds.length).toBe(6);
  expect(pools[2].seeds.length).toBe(6);

  expect(pools[0].seeds).toMatchObject([1, 6, 7, 12, 13]);
  expect(pools[1].seeds).toMatchObject([2, 5, 8, 11, 14, 17]);
  expect(pools[2].seeds).toMatchObject([3, 4, 9, 10, 15, 16]);
});

test('snakeSeed03', () => {
  const pools = makePoolSet(3, 6, 1, 'test', []);
  snakeSeed(pools, 10, 18);

  expect(pools[0].seeds.length).toBe(3);
  expect(pools[1].seeds.length).toBe(3);
  expect(pools[2].seeds.length).toBe(3);

  expect(pools[0].seeds).toMatchObject([10, 15, 16]);
  expect(pools[1].seeds).toMatchObject([11, 14, 17]);
  expect(pools[2].seeds).toMatchObject([12, 13, 18]);
});
