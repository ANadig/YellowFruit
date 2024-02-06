import { IIndeterminateQbj, IQbjObject, IQbjRefPointer, IRefTargetDict } from './Interfaces';

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
