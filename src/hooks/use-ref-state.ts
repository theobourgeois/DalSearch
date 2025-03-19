import { useEffect, useRef, useState } from "react";

export function useRefState<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [state, setState, stateRef] as const;
}