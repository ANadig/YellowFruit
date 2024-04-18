import { expect, test } from 'vitest';
import Tournament from '../renderer/DataModel/Tournament';
import { convertFormatQbjToYf, convertFormatYfToQbj } from '../renderer/DataModel/FileConversion';

test('yfToQbj01', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  convertFormatYfToQbj(fileObj);

  expect(fileObj.question_set).toBe(tourn.questionSet);
  expect(fileObj.scoring_rules).toBeDefined();

  expect(fileObj.questionSet).toBeUndefined();
  expect(fileObj.scoringRules).toBeUndefined();
});

test('yfToQbj02', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  convertFormatYfToQbj(fileObj);

  expect(fileObj.scoring_rules.maximum_bonus_score).toBe(30);
});

test('yfToQbj01', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  convertFormatYfToQbj(fileObj);

  expect(fileObj.question_set).toBe(tourn.questionSet);
  expect(fileObj.scoring_rules).toBeDefined();

  convertFormatQbjToYf(fileObj);

  expect(fileObj.questionSet).toBe(tourn.questionSet);
  expect(fileObj.scoringRules).toBeDefined();

  expect(fileObj.question_set).toBeUndefined();
  expect(fileObj.scoring_rules).toBeUndefined();
});

test('yfToQbj02', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  convertFormatYfToQbj(fileObj);

  expect(fileObj.scoring_rules.maximum_bonus_score).toBe(30);

  convertFormatQbjToYf(fileObj);

  expect(fileObj.scoringRules.maximumBonusScore).toBe(30);
});
