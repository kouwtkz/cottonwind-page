import { HTMLAttributes, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { create } from "zustand";

type ThemeStateType = {
  index: number;
  list: string[];
  theme: string;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
};

export function createThemeState(list: string[]) {
  return create<ThemeStateType>((set) => ({
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

const ThemeList = ["theme-orange", "theme-aqua"];
export const useThemeState = createThemeState(ThemeList);

export function ThemeState() {
  const { index, theme, list, setIndex } = useThemeState();
  const cookieKey = "theme";
  const [cookies, setCookie, removeCookie] = useCookies([cookieKey]);
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
          setCookie(cookieKey, theme);
        } else {
          removeCookie(cookieKey);
        }
        refIndex.current = index;
      }
    } else {
      isSet.current = true;
      if (cookies[cookieKey]) {
        document?.documentElement.classList.add(cookies[cookieKey]);
        const cookieIndex = list.findIndex((v) => v === cookies[cookieKey]);
        setIndex(cookieIndex);
        refIndex.current = cookieIndex;
      }
    }
  });
  return <></>;
}

interface ThemeChangeButtonProps extends HTMLAttributes<HTMLDivElement> {}

export function ThemeChangeButton({
  children = "いろかえ",
  ...args
}: ThemeChangeButtonProps) {
  const { next } = useThemeState();
  return (
    <div {...args} onClick={next}>
      {children}
    </div>
  );
}

const DarkThemeList = ["dark", "auto"];
export const useDarkThemeState = createThemeState(DarkThemeList);

export function DarkThemeState() {
  const { index, theme, list, setIndex } = useDarkThemeState();
  const cookieKey = "darktheme";
  const [cookies, setCookie, removeCookie] = useCookies([cookieKey]);
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
          setCookie(cookieKey, theme);
        } else {
          removeCookie(cookieKey);
        }
        refIndex.current = index;
      }
    } else {
      isSet.current = true;
      if (cookies[cookieKey]) {
        document?.documentElement.classList.add(cookies[cookieKey]);
        const cookieIndex = list.findIndex((v) => v === cookies[cookieKey]);
        setIndex(cookieIndex);
        refIndex.current = cookieIndex;
      }
    }
  });
  return <></>;
}

export function DarkThemeChangeButton({
  children = "ダークテーマ",
  ...args
}: ThemeChangeButtonProps) {
  const { next } = useDarkThemeState();
  return (
    <div {...args} onClick={next}>
      {children}
    </div>
  );
}
