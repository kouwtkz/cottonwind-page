import { type HTMLAttributes, useEffect, useMemo, useRef } from "react";
import type { CookieOptions } from "react-router";
import type { StoreApi, UseBoundStore } from "zustand";
import { CreateObjectState } from "~/components/state/CreateState";
import { getCookieObject } from "../utils/Cookie";

export interface ThemeChangeButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {}

type ThemeStateType = {
  index: number;
  list: string[];
  theme: string;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
};

export function createThemeState(list: string[]) {
  return CreateObjectState<ThemeStateType>((set) => ({
    index: -1,
    list,
    theme: "",
    setIndex: (index) => {
      set((state) => {
        return { index, theme: state.list[index] || "" };
      });
    },
    next: () => {
      set((state) => {
        let index = state.index + 1;
        if (index >= state.list.length) index = -1;
        return { index, theme: state.list[index] || "" };
      });
    },
    prev: () => {
      set((state) => {
        let index = state.index - 1;
        if (index < -1) index = state.list.length - 1;
        return { index, theme: state.list[index] || "" };
      });
    },
  }));
}

export function getCookies() {
  return getCookieObject(globalThis.document?.cookie || "");
}
interface setCookieProps {
  key: string;
  value?: string;
  options?: CookieOptions;
}
export function setCookie({ key, value, options = {} }: setCookieProps) {
  const optionList: string[] = [];
  let cookie = key;
  if (typeof value !== "undefined") cookie = cookie + "=" + value;
  optionList.push(cookie);
  if (typeof options.maxAge === "number")
    optionList.push("max-age=" + options.maxAge);
  if (options.partitioned) optionList.push("partitioned");
  if (options.path) optionList.push("path=" + options.path);
  if (options.sameSite) {
    if (typeof options.sameSite === "string")
      optionList.push("samesite=" + options.sameSite);
    else optionList.push("samesite");
  }
  if (options.domain) optionList.push("domain=" + options.domain);
  document.cookie = optionList.join(" ;");
}
export function removeCookie({ key, options }: Omit<setCookieProps, "value">) {
  return setCookie({ key, value: "", options: { ...options, maxAge: 0 } });
}

export class ThemeStateClass {
  themes: string[];
  cookieKey: string;
  use: UseBoundStore<StoreApi<ThemeStateType>>;
  constructor(cookieKey: string, themes: string[]) {
    this.cookieKey = cookieKey;
    this.themes = themes;
    this.use = createThemeState(this.themes);
  }
  State() {
    const { index, theme, list, setIndex } = this.use();
    const cookies = useMemo(() => getCookies(), []);
    const isSet = useRef(false);
    const refIndex = useRef(-1);
    useEffect(() => {
      if (isSet.current) {
        if (refIndex.current !== index) {
          if (refIndex.current >= 0) {
            document.documentElement.classList.remove(list[refIndex.current]);
          }
          if (index >= 0) {
            document.documentElement.classList.add(theme);
            setCookie({
              key: this.cookieKey,
              value: theme,
              options: {
                maxAge: 34e6,
                path: "/",
              },
            });
          } else {
            removeCookie({ key: this.cookieKey, options: { path: "/" } });
          }
          refIndex.current = index;
        }
      } else {
        isSet.current = true;
        if (cookies[this.cookieKey]) {
          document?.documentElement.classList.add(cookies[this.cookieKey]);
          const cookieIndex = list.findIndex(
            (v) => v === cookies[this.cookieKey]
          );
          setIndex(cookieIndex);
          refIndex.current = cookieIndex;
        }
      }
    });
    return <></>;
  }
}
