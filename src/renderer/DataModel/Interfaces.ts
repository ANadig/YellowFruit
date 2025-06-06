import { QbjTypeNames } from './QbjEnums';

/** Top-level structure of the QBJ file format https://schema.quizbowl.technology/serialization/ */
export interface IQbjWholeFile {
  version: '2.1.1'; // qbj schema version, not YF version
  objects: IQbjObject[];
}

/** Something from a QBJ file that might be a ref pointer or a regular object */
export interface IIndeterminateQbj {
  $ref?: string;
}

/** A generic object that isn't a ref pointer */
export interface IQbjObject {
  type?: QbjTypeNames;
  id?: string;
}

export interface IQbjRefPointer {
  $ref: string;
}

export interface IRefTargetDict {
  [id: string]: IQbjObject;
}

/** Used for supplementing QBJ data types with additional YF-specific info */
export interface IYftFileObject {
  YfData?: object;
}

export interface IYftDataModelObject {
  /** Generate an object that we can save to a file (qbj or yft) */
  toFileObject: (qbjOnly?: boolean, isTopLevel?: boolean, isReferenced?: boolean, idXtraPc?: string) => IQbjObject;
}

export enum ValidationStatuses {
  Ok,
  Error,
  Warning,
  Info,
  HiddenError, // for things that are so obvious we don't need to constantly annoy users until they do it (e.g. a team's total score being required)
}

export interface IValidationInfo {
  status: ValidationStatuses;
  message: string;
}

export function makeEmptyValidator(): IValidationInfo {
  return { status: ValidationStatuses.Ok, message: '' };
}
