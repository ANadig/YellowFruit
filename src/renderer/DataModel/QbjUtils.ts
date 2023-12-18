import { IIndeterminateQbj, IQbjObject, IQbjRefPointer, IRefTargetDict } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { IQbjScoringRules } from './ScoringRules';

export function makeQbjRefPointer($ref: string): IQbjRefPointer {
  return { $ref };
}

export function isQbjRefPointer(obj: IIndeterminateQbj): boolean {
  const { $ref } = obj;
  return !!$ref;
}

export function getBaseQbjObject(obj: IIndeterminateQbj, refTargets: IRefTargetDict): IQbjObject | null {
  if (!isQbjRefPointer(obj)) return obj as IQbjObject;

  const refObj = obj as IQbjRefPointer;
  const target = refTargets[refObj.$ref];
  if (target && !isQbjRefPointer(target as IIndeterminateQbj)) return target;
  return null;
}

export function collectRefTargets(objectList: IQbjObject[]): IRefTargetDict {
  let dict: IRefTargetDict = {};

  for (const obj of objectList) {
    if (obj.id) dict[obj.id] = obj;

    if (obj.type === QbjTypeNames.ScoringRules)
      dict = { ...dict, ...collectRefTargetsScoringRules(obj as IQbjScoringRules) };
  }

  return dict;
}

export function collectRefTargetsScoringRules(rules: IQbjScoringRules) {
  const dict: IRefTargetDict = {};
  if (!rules.answerTypes) return dict;

  for (const atype of rules.answerTypes) {
    if (atype.id) dict[atype.id] = atype;
  }
  return dict;
}
