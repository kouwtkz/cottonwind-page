import { useMemo } from "react";
import { Link } from "react-router-dom";
import MenuButton from "../components/svg/button/MenuButton";
import { create } from "zustand";
import { ThemeChangeButtonProps } from "./ThemeSetter";
import { DarkThemeState, ThemeState, useManageState } from "./StateSet";
import SiteConfigList from "@/data/config.list";
import { CgDarkMode, CgMoon, CgSun } from "react-icons/cg";
import { PiDrop, PiLeaf, PiOrangeSlice } from "react-icons/pi";

export function ThemeChangeButton({
  children = "いろかえ",
  ...args
}: ThemeChangeButtonProps) {
  const { next } = ThemeState.use();
  return (
    <div {...args} onClick={next}>
      {children}
    </div>
  );
}

function DarkThemeChangeButton({
  children = "ダークテーマ",
  ...args
}: ThemeChangeButtonProps) {
  const { next } = DarkThemeState.use();
  return (
    <div {...args} onClick={next}>
      {children}
    </div>
  );
}

type SiteMenuStateType = {
  isOpen: boolean;
  SetIsOpen: (isOpen: boolean) => void;
  ToggleIsOpen: () => void;
};
export const useSiteMenuState = create<SiteMenuStateType>((set) => ({
  isOpen: false,
  SetIsOpen: (isOpen) => {
    set(() => ({ isOpen }));
  },
  ToggleIsOpen: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
}));

function SetSiteMenu({ nav }: { nav: SiteMenuItemType[] }) {
  const { SetIsOpen } = useSiteMenuState();
  const { visibleWorkers } = useManageState();
  const list = useMemo(() => {
    const list = nav.concat();
    if (visibleWorkers)
      list.push({ name: "workers", url: "/workers", out: true });
    list.push({ name: "theme", switch: "theme" });
    return list;
  }, [nav, visibleWorkers]);
  return (
    <div className="siteMenu">
      {list.map((item, i) => {
        if (item.url) {
          if (item.out) {
            return (
              <a key={i} href={item.url} className="item">
                {item.short || item.name}
              </a>
            );
          } else {
            return (
              <Link
                key={i}
                to={item.url}
                className="item"
                onClick={() => {
                  setTimeout(() => {
                    SetIsOpen(false);
                  }, 350);
                }}
              >
                {item.short || item.name}
              </Link>
            );
          }
        } else {
          if (item.switch) {
            switch (item.name) {
              case "color":
                return (
                  <ThemeChangeButton key={i} className="item theme">
                    {item.name}
                  </ThemeChangeButton>
                );
              case "dark":
                return (
                  <DarkThemeChangeButton key={i} className="item theme">
                    {item.name}
                  </DarkThemeChangeButton>
                );
              default:
                return <ThemeSwitchButtons key={i} />;
            }
          }
        }
      })}
    </div>
  );
}

function ThemeSwitchButtons({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { theme: colortheme } = ThemeState.use();
  const { theme: darktheme } = DarkThemeState.use();
  className = useMemo(
    () => (className ? className + " " : "") + "theme",
    [className]
  );
  return (
    <div {...props} className={className}>
      <ThemeChangeButton className="item">
        {colortheme === "theme-orange" ? (
          <PiOrangeSlice />
        ) : colortheme === "theme-aqua" ? (
          <PiDrop />
        ) : (
          <PiLeaf />
        )}
      </ThemeChangeButton>
      <DarkThemeChangeButton className="item">
        {darktheme === "auto" ? (
          <CgDarkMode />
        ) : darktheme === "dark" ? (
          <CgMoon />
        ) : (
          <CgSun />
        )}
      </DarkThemeChangeButton>
    </div>
  );
}

export function SiteMenu() {
  const { isOpen } = useSiteMenuState();
  return (
    <>
      {SiteConfigList.nav ? (
        <div style={isOpen ? {} : { display: "none" }}>
          <SetSiteMenu nav={SiteConfigList.nav} />
        </div>
      ) : null}
    </>
  );
}

export function SiteMenuButton() {
  const { isOpen, ToggleIsOpen } = useSiteMenuState(
    ({ isOpen, ToggleIsOpen }) => ({ isOpen, ToggleIsOpen })
  );
  return (
    <MenuButton
      isOpen={isOpen}
      onClick={ToggleIsOpen}
      className="siteMenuButton"
    />
  );
}
