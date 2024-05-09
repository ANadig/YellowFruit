import { expect, test } from 'vitest';
import { Sched30Teams10RoundsPlusF } from '../renderer/DataModel/Schedules/30-team';
import { Sched24Teams11Rounds2Phases5Prelim } from '../renderer/DataModel/Schedules/24-team';

test('getTopWildCardSeed01', () => {
  const prelims = Sched30Teams10RoundsPlusF.constructPhases()[0];

  expect(prelims.getTopWildCardSeed()).toBe(11);
});

test('getTopWildCardSeed02', () => {
  const prelims = Sched24Teams11Rounds2Phases5Prelim.constructPhases()[0];

  expect(prelims.getTopWildCardSeed()).toBe(0);
});
