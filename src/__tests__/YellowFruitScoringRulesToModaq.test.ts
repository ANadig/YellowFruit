import { describe, expect, test } from 'vitest';
import scoringRulesToModaqGameFormat, {
  IModaqFormatFailure,
  IModaqFormatSuccess,
  modaqGameFormatVersion,
} from '../renderer/Services/YellowFruitScoringRulesToModaq';
import { CommonRuleSets, ScoringRules } from '../renderer/DataModel/ScoringRules';
import AnswerType from '../renderer/DataModel/AnswerType';

function expectOk(rules: ScoringRules): IModaqFormatSuccess {
  const result = scoringRulesToModaqGameFormat(rules);
  if (!result.ok) throw new Error(`Expected a translatable format, got errors: ${result.errors.join(' / ')}`);
  return result;
}

function expectFailure(rules: ScoringRules): IModaqFormatFailure {
  const result = scoringRulesToModaqGameFormat(rules);
  if (result.ok) throw new Error('Expected the format to be rejected, but it was translated');
  return result;
}

describe('ACF', () => {
  test('standard ACF maps to a powerless format with negs', () => {
    const { gameFormat } = expectOk(new ScoringRules(CommonRuleSets.Acf));

    expect(gameFormat.powers).toHaveLength(0);
    expect(gameFormat.negValue).toBe(-5);
    expect(gameFormat.regulationTossupCount).toBe(20);
    expect(gameFormat.minimumOvertimeQuestionCount).toBe(1);
    expect(gameFormat.overtimeIncludesBonuses).toBe(false);
    expect(gameFormat.bonusesBounceBack).toBe(false);
    expect(gameFormat.pairTossupsBonuses).toBe(true);
    expect(gameFormat.version).toBe(modaqGameFormatVersion);
  });

  test('ACF produces no warnings, since it translates exactly', () => {
    const { warnings } = expectOk(new ScoringRules(CommonRuleSets.Acf));

    expect(warnings).toHaveLength(0);
  });
});

describe('ACF with powers', () => {
  test("a 15-point power becomes MODAQ's (*) marker", () => {
    const { gameFormat } = expectOk(new ScoringRules(CommonRuleSets.AcfPowers));

    expect(gameFormat.powers).toEqual([{ marker: '(*)', points: 15 }]);
    expect(gameFormat.negValue).toBe(-5);
  });

  test('the power marker guess is surfaced as a warning', () => {
    const { warnings } = expectOk(new ScoringRules(CommonRuleSets.AcfPowers));

    expect(warnings.join(' ')).toContain('(*)');
  });

  test('a 20-point power becomes the (+) marker', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(20), new AnswerType(10), new AnswerType(-5)];
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.powers).toEqual([{ marker: '(+)', points: 20 }]);
  });

  test('two power tiers get distinct markers, highest value first', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(15), new AnswerType(20), new AnswerType(10), new AnswerType(-5)];
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.powers.map((p) => p.points)).toEqual([20, 15]);
    expect(new Set(gameFormat.powers.map((p) => p.marker)).size).toBe(2);
  });
});

describe('NAQT untimed', () => {
  test('translates, keeping the 3-tossup overtime minimum', () => {
    const { gameFormat } = expectOk(new ScoringRules(CommonRuleSets.NaqtUntimed));

    expect(gameFormat.minimumOvertimeQuestionCount).toBe(3);
    expect(gameFormat.regulationTossupCount).toBe(20);
    expect(gameFormat.powers).toEqual([{ marker: '(*)', points: 15 }]);
  });
});

describe('expected neg and power behavior', () => {
  test('no neg answer type means a neg value of 0, not a guess', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(10)];
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.negValue).toBe(0);
  });

  test('a nonstandard neg value is carried through as-is', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(10), new AnswerType(-10)];
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.negValue).toBe(-10);
  });

  test('bouncebacks and overtime bonuses are carried through', () => {
    const rules = new ScoringRules(CommonRuleSets.AcfPowers);
    rules.bonusesBounceBack = true;
    rules.overtimeIncludesBonuses = true;
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.bonusesBounceBack).toBe(true);
    expect(gameFormat.overtimeIncludesBonuses).toBe(true);
  });

  test('a tossup-only format turns off tossup/bonus pairing', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.setUseBonuses(false);
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.pairTossupsBonuses).toBe(false);
  });

  test('a nonstandard regulation tossup count is carried through', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.maximumRegulationTossupCount = 24;
    const { gameFormat } = expectOk(rules);

    expect(gameFormat.regulationTossupCount).toBe(24);
  });
});

describe('unsupported formats produce explicit errors', () => {
  test('lightning rounds are rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.AcfPowers);
    rules.lightningCountPerTeam = 1;
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('lightning');
  });

  test('a base tossup value other than 10 is rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(5), new AnswerType(-5)];
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('10 points');
  });

  test('two different neg values are rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(10), new AnswerType(-5), new AnswerType(-10)];
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('single neg value');
  });

  test('having no answer types at all is rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [];
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('no answer types');
  });

  test('a bonus that is not 3 parts is rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.AcfPowers);
    rules.minimumPartsPerBonus = 4;
    rules.maximumPartsPerBonus = 4;
    rules.maximumBonusScore = 40;
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('3 parts');
  });

  test('a bonus part worth something other than 10 is rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.AcfPowers);
    rules.pointsPerBonusPart = 5;
    rules.maximumBonusScore = 15;
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('10 points each');
  });

  test('an irregular bonus is rejected', () => {
    const rules = new ScoringRules(CommonRuleSets.AcfPowers);
    rules.pointsPerBonusPart = undefined;
    const { errors } = expectFailure(rules);

    expect(errors.join(' ')).toContain('same number of parts');
  });

  test('a bonus-free tournament is not judged on its bonus settings', () => {
    // A tossup-only format can have leftover bonus settings that would otherwise be rejected.
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.pointsPerBonusPart = undefined;
    rules.setUseBonuses(false);

    expect(scoringRulesToModaqGameFormat(rules).ok).toBe(true);
  });

  test('every reason for rejection is reported, not just the first', () => {
    const rules = new ScoringRules(CommonRuleSets.Acf);
    rules.answerTypes = [new AnswerType(5), new AnswerType(-5), new AnswerType(-10)];
    rules.lightningCountPerTeam = 2;
    const { errors } = expectFailure(rules);

    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('timed rounds', () => {
  test('translate with a warning rather than an error', () => {
    const { gameFormat, warnings } = expectOk(new ScoringRules(CommonRuleSets.NaqtTimed));

    expect(gameFormat.regulationTossupCount).toBe(ScoringRules.defaultRegulationTossupCount);
    expect(warnings.join(' ')).toContain('timed rounds');
  });
});
