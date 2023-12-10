/**
 * Custom React hooks
 */

import React, { useState, useEffect } from 'react';

/**
 * Bundles useState and useEffect to synchronize a component's state with the data model
 * @param valFromProps Value from the tournament data to synchronize with
 * @param defaultVal Value to use instead of null/undefined
 * @returns A value-setter tuple, like useState
 */
function useSubscription<T>(valFromProps: T, defaultVal: T): [T, React.Dispatch<T>] {
  const valToUse = valFromProps ?? defaultVal;
  const [val, setVal] = useState(valToUse);
  useEffect(() => setVal(valToUse), [valToUse]);
  return [val, setVal];
}

export default useSubscription;
