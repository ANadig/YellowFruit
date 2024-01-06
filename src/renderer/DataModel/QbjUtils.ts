/* eslint-disable import/no-cycle */
import { IIndeterminateQbj, IQbjObject, IQbjRefPointer, IRefTargetDict } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
import { IQbjScoringRules } from './ScoringRules';
import { IQbjTournament } from './Tournament';

export function makeQbjRefPointer($ref: string): IQbjRefPointer {
  return { $ref };
}

export function isQbjRefPointer(obj: IIndeterminateQbj): boolean {
  const { $ref } = obj;
  return !!$ref;
}

/** Returns the given object, or the object it points to if it's a ref pointer */
export function getBaseQbjObject(obj: IIndeterminateQbj, refTargets: IRefTargetDict): IQbjObject | null {
  if (!isQbjRefPointer(obj)) return obj as IQbjObject;

  const refObj = obj as IQbjRefPointer;
  const target = refTargets[refObj.$ref];
  if (target && !isQbjRefPointer(target as IIndeterminateQbj)) return target;
  return null;
}

/** Parse a file and collect all the objects that have an 'id' property */
export function collectRefTargets(objectList: IQbjObject[]): IRefTargetDict {
  let dict: IRefTargetDict = {};

  for (const obj of objectList) {
    if (obj.id) dict[obj.id] = obj;
    // everything in the top-level array of objects should have a 'type' property
    if (obj.type === QbjTypeNames.Tournament) dict = { ...dict, ...collectRefTargetsTournament(obj as IQbjTournament) };

    if (obj.type === QbjTypeNames.ScoringRules)
      dict = { ...dict, ...collectRefTargetsScoringRules(obj as IQbjScoringRules) };

    // TODO: every other type of object that could theoretically be at the top level
  }

  return dict;
}

function collectRefTargetsTournament(tournament: IQbjTournament) {
  let dict: IRefTargetDict = {};
  const site = tournament.tournamentSite;
  if (site?.id) dict[site.id] = site;

  const rules = tournament.scoringRules;
  if (rules) dict = { ...dict, ...collectRefTargetsScoringRules(rules) };
  if (rules?.id) dict[rules.id] = rules;

  // TODO: registrations, phases
  return dict;
}

function collectRefTargetsScoringRules(rules: IQbjScoringRules) {
  const dict: IRefTargetDict = {};
  if (!rules.answerTypes) return dict;

  for (const atype of rules.answerTypes) {
    if (atype.id) dict[atype.id] = atype;
  }
  return dict;
}
