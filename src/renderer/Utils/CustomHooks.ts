/**
 * Custom React hooks
 */

import React, { useState, useEffect } from 'react';

/**
 * Bundles useState and useEffect to synchronize a component's state with the data model
 * @param valFromProps Value from the tournament data to synchronize with
 * @returns A value-setter tuple, like useState
 */
function useSubscription<T>(valFromProps: T): [T, React.Dispatch<T>] {
  const [val, setVal] = useState(valFromProps);
  useEffect(() => setVal(valFromProps), [valFromProps]);
  return [val, setVal];
}

export default useSubscription;
