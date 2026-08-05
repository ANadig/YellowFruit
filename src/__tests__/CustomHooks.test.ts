import { expect, test } from 'vitest';
import { subscriptionValuesEqual } from '../renderer/Utils/CustomHooks';

test('subscriptionValuesEqual recognizes the same scalar or reference', () => {
  const value = { id: 1 };
  expect(subscriptionValuesEqual(value, value)).toBe(true);
  expect(subscriptionValuesEqual('ready', 'ready')).toBe(true);
});

test('subscriptionValuesEqual recognizes shallowly equal arrays', () => {
  const item = { id: 1 };
  expect(subscriptionValuesEqual([item, 2], [item, 2])).toBe(true);
});

test('subscriptionValuesEqual does not hide changed array contents or lengths', () => {
  const item = { id: 1 };
  expect(subscriptionValuesEqual([item], [item, 2])).toBe(false);
  expect(subscriptionValuesEqual([item], [{ id: 1 }])).toBe(false);
});
