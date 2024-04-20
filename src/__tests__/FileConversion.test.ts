import { expect, test } from 'vitest';
import Tournament from '../renderer/DataModel/Tournament';
import { snakeCaseToCamelCase, camelCaseToSnakeCase } from '../renderer/DataModel/CaseConversion';

test('yfToQbj01', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  camelCaseToSnakeCase(fileObj);

  expect(fileObj.question_set).toBe(tourn.questionSet);
  expect(fileObj.scoring_rules).toBeDefined();

  expect(fileObj.questionSet).toBeUndefined();
  expect(fileObj.scoringRules).toBeUndefined();
});

test('yfToQbj02', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  camelCaseToSnakeCase(fileObj);

  expect(fileObj.scoring_rules.maximum_bonus_score).toBe(30);
});

test('yfToQbj01', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  camelCaseToSnakeCase(fileObj);

  expect(fileObj.question_set).toBe(tourn.questionSet);
  expect(fileObj.scoring_rules).toBeDefined();

  snakeCaseToCamelCase(fileObj);

  expect(fileObj.questionSet).toBe(tourn.questionSet);
  expect(fileObj.scoringRules).toBeDefined();

  expect(fileObj.question_set).toBeUndefined();
  expect(fileObj.scoring_rules).toBeUndefined();
});

test('yfToQbj02', () => {
  const tourn = new Tournament();
  tourn.questionSet = 'test question set';
  const fileObj = tourn.toFileObject() as any;
  camelCaseToSnakeCase(fileObj);

  expect(fileObj.scoring_rules.maximum_bonus_score).toBe(30);

  snakeCaseToCamelCase(fileObj);

  expect(fileObj.scoringRules.maximumBonusScore).toBe(30);
});
