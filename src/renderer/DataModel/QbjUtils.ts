import { IIndeterminateQbj, IQbjObject, IQbjRefPointer, IQbjWholeFile, IRefTargetDict } from './Interfaces';
import { QbjTypeNames } from './QbjEnums';
// eslint-disable-next-line import/no-cycle
import { IQbjTournament } from './Tournament';

export function makeQbjRefPointer($ref: string): IQbjRefPointer {
  return { $ref };
}

export function isQbjRefPointer(obj: IIndeterminateQbj): boolean {
  const { $ref } = obj;
  return !!$ref;
}

const validQbjVersions = ['2.1.1'];

export function qbjFileValidVersion(obj: IQbjWholeFile) {
  const { version } = obj;
  if (!version) return false;
  return validQbjVersions.includes(version);
}

export function findTournamentObject(objects: IQbjObject[]): IQbjTournament | null {
  for (const obj of objects) {
    if (obj.type === QbjTypeNames.Tournament) return obj as IQbjTournament;
  }
  return null;
}

/** Returns the given object, or the object it points to if it's a ref pointer */
export function getBaseQbjObject(obj: IIndeterminateQbj, refTargets: IRefTargetDict): IQbjObject | null {
  if (!isQbjRefPointer(obj)) return obj as IQbjObject;

  const refObj = obj as IQbjRefPointer;
  const target = refTargets[refObj.$ref];
  if (target && !isQbjRefPointer(target as IIndeterminateQbj)) return target;
  return null;
}
