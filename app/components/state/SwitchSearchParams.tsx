import type { CreateStateFunctionType } from "./CreateState";
import type { NavigateOptions, SetURLSearchParams } from "react-router";

export function SwitchSearchParams(
  {
    key,
    on = "on",
    off,
    state: [searchParams, setSearchParams],
  }: {
    key: string;
    on?: string;
    off?: string;
    state: [URLSearchParams, SetURLSearchParams];
  },
  navigateOpts?: NavigateOptions
): CreateStateFunctionType<boolean> {
  return () => {
    const isOn = off ? searchParams.get(key) !== off : searchParams.has(key);
    return [
      isOn,
      () => {
        if (isOn) {
          if (off) searchParams.set(key, off);
          else searchParams.delete(key);
        } else {
          searchParams.set(key, on);
        }
        setSearchParams({ ...Object.fromEntries(searchParams) }, navigateOpts);
      },
    ];
  };
}
