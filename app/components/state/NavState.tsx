import { useEffect, useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";

let beforeState: Object | undefined;
export function NavKeepState() {
  const { state } = useLocation();
  const nav = useNavigate();
  useEffect(() => {
    if (state && typeof state === "object") {
      if (state.keep) {
        delete state.keep;
        nav(location, {
          preventScrollReset: true,
          replace: true,
          state:
            beforeState && typeof beforeState === "object"
              ? { ...beforeState, ...state }
              : { ...state },
        });
      }
    }
    beforeState = state;
  }, [state]);
  return <></>;
}
