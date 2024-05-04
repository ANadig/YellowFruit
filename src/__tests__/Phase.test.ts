import { expect, test } from 'vitest';
import { Sched30Teams11Rounds2PPlusF } from '../renderer/DataModel/Schedules/30-team';
import { Sched24Teams11Rounds2Phases5Prelim } from '../renderer/DataModel/Schedules/24-team';

test('getTopWildCardSeed01', () => {
  const prelims = new Sched30Teams11Rounds2PPlusF().phases[0];

  expect(prelims.getTopWildCardSeed()).toBe(11);
});

test('getTopWildCardSeed02', () => {
  const prelims = new Sched24Teams11Rounds2Phases5Prelim().phases[0];

  expect(prelims.getTopWildCardSeed()).toBe(0);
});
