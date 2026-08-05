/**
 * Custom React hooks
 */

import React, { useState, useEffect } from 'react';

/**
 * Data-model collections are often recreated while a component renders. Treat two shallowly
 * equal arrays as the same subscription value so derived arrays cannot cause an update loop.
 */
export function subscriptionValuesEqual<T>(left: T, right: T): boolean {
  if (Object.is(left, right)) return true;
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  return left.every((item, index) => Object.is(item, right[index]));
}

/**
 * Bundles useState and useEffect to synchronize a component's state with the data model
 * @param valFromDataModel Value from the tournament data to synchronize with
 * @returns A value-setter tuple, like useState
 */
function useSubscription<T>(valFromDataModel: T): [T, React.Dispatch<T>] {
  const [val, setVal] = useState(valFromDataModel);
  useEffect(() => {
    setVal((current) => (subscriptionValuesEqual(current, valFromDataModel) ? current : valFromDataModel));
  }, [valFromDataModel]);
  return [val, setVal];
}

export default useSubscription;
