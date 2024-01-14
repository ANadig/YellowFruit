import { expect, test } from 'vitest';
import AnswerType, { IYftFileAnswerType } from '../renderer/DataModel/AnswerType';

test('answerType01', () => {
  const aType = new AnswerType(15);

  expect(aType.value).toBe(15);
  expect(aType.label).toBe('15');
  expect(aType.shortLabel).toBe('15');
});

test('answerType02', () => {
  const aType = new AnswerType(15);
  const label = 'Power';
  aType.label = label;

  expect(aType.label).toBe(label);
  expect(aType.shortLabel).toBe(label);
});

test('answerType03', () => {
  const aType = new AnswerType(15);
  const label = 'Power';
  const short = 'Pow';
  aType.label = label;
  aType.shortLabel = short;

  expect(aType.label).toBe(label);
  expect(aType.shortLabel).toBe(short);
});

test('toQbjObject01', () => {
  const aType = new AnswerType(15);
  const qbjObj = aType.toFileObject();

  expect(qbjObj.value).toBe(15);
  expect(qbjObj.label).toBeUndefined();
  expect(qbjObj.awardsBonus).toBeUndefined();
});

test('toQbjObject02', () => {
  const aType = new AnswerType(15);
  aType.label = 'Power';
  const qbjObj = aType.toFileObject();

  expect(qbjObj.value).toBe(15);
  expect(qbjObj.label).toBe('Power');
  expect(qbjObj.shortLabel).toBeUndefined();
});

test('toQbjObject02', () => {
  const aType = new AnswerType(15);
  const yftObj = aType.toFileObject() as IYftFileAnswerType;

  expect(yftObj.value).toBe(15);
  expect(yftObj.label).toBeUndefined();
  expect(yftObj.awardsBonus).toBeUndefined();
});
