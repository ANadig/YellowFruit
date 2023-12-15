import { QbjTypeNames } from './QbjEnums';

export interface IQbjObject {
  type?: QbjTypeNames;
  id?: string;
}

export interface IQbjRefPointer {
  $ref: string;
}

/** Used for supplementing QBJ data types with additional YF-specific info */
export interface IYftFileObject {
  YfData?: object;
}

export interface IYftDataModelObject {
  toQbjObject: () => IQbjObject | IQbjRefPointer;
  toYftFileObject: () => IYftFileObject;
}
