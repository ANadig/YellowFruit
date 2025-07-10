import { expect, test } from 'vitest';
import MatchValidationMessage, {
  MatchValidationCollection,
  MatchValidationType,
} from '../renderer/DataModel/MatchValidationMessage';
import { ValidationStatuses } from '../renderer/DataModel/Interfaces';

test('makeCopy01', () => {
  const source = new MatchValidationMessage(
    MatchValidationType.BonusPointsTooHigh,
    ValidationStatuses.Warning,
    'test msg',
    true,
    false,
  );
  const copy = source.makeCopy();

  expect(copy.type).toBe(MatchValidationType.BonusPointsTooHigh);
  expect(copy.status).toBe(ValidationStatuses.Warning);
  expect(copy.message).toBe('test msg');
  expect(copy.suppressable).toBe(true);
  expect(copy.isSuppressed).toBe(false);
});

test('collectionMakeCopy01', () => {
  const source = new MatchValidationCollection();
  source.addValidationMsg(
    MatchValidationType.BonusDivisorMismatch,
    ValidationStatuses.Warning,
    'test msg',
    true,
    false,
  );
  const copy = source.makeCopy();

  expect(copy.validators[0].type).toBe(MatchValidationType.BonusDivisorMismatch);
  expect(copy.validators[0].status).toBe(ValidationStatuses.Warning);
  expect(copy.validators[0].message).toBe('test msg');
  expect(copy.validators[0].suppressable).toBe(true);
  expect(copy.validators[0].isSuppressed).toBe(false);
});
