import { IIndeterminateQbj, IQbjObject, IQbjRefPointer, IQbjWholeFile, IRefTargetDict } from './Interfaces';

export function makeQbjRefPointer($ref: string): IQbjRefPointer {
  return { $ref };
}

export function isQbjRefPointer(obj: IIndeterminateQbj): boolean {
  const { $ref } = obj;
  return !!$ref;
}

/** Versions of the qbj schema that YFT supports */
const validQbjVersions = ['2.1.1'];

/** Does this file use a version of the qbj schema that we support? */
export function qbjFileValidVersion(obj: IQbjWholeFile) {
  const { version } = obj;
  if (!version) return false;
  return validQbjVersions.includes(version);
}

/** Returns the given object, or the object it points to if it's a ref pointer */
export function getBaseQbjObject(obj: IIndeterminateQbj, refTargets: IRefTargetDict): IQbjObject | null {
  if (!isQbjRefPointer(obj)) return obj as IQbjObject;

  const refObj = obj as IQbjRefPointer;
  const target = refTargets[refObj.$ref];
  if (target && !isQbjRefPointer(target as IIndeterminateQbj)) return target;
  return null;
}
