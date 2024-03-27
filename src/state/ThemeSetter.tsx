import { HTMLAttributes, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { create } from "zustand";

const ThemeList = ["theme-orange", "theme-aqua"];

type ThemeStateType = {
  index: number;
  list: string[];
  theme: string;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
};
export const useThemeState = create<ThemeStateType>((set) => ({
  index: -1,
  list: ThemeList,
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

export function ThemeState() {
  const { index, theme, list, setIndex } = useThemeState();
  const [cookies, setCookie, removeCookie] = useCookies(["theme"]);
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
          setCookie("theme", theme);
        } else {
          removeCookie("theme");
        }
        refIndex.current = index;
      }
    } else {
      isSet.current = true;
      if (cookies.theme) {
        document?.documentElement.classList.add(cookies.theme);
        const cookieIndex = list.findIndex((v) => v === cookies.theme);
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
