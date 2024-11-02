import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SiteMenuButton } from "../components/svg/button/MenuButton";
import { ThemeChangeButtonProps } from "./ThemeSetter";
import { DarkThemeState, ThemeState } from "./StateSet";
import { CgDarkMode, CgMoon, CgSun } from "react-icons/cg";
import { PiDrop, PiLeaf, PiOrangeSlice } from "react-icons/pi";
import { DropdownObject } from "@/components/dropdown/DropdownMenu";
import { useEnv, useIsLogin } from "./EnvState";
import { ArrayEnv } from "@/ArrayEnv";

export function ThemeChangeButton({
  children = "いろかえ",
  ...args
}: ThemeChangeButtonProps) {
  const { next } = ThemeState.use();
  return (
    <div
      {...args}
      onClick={(e) => {
        e.stopPropagation();
        next();
      }}
    >
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
    <div
      {...args}
      onClick={(e) => {
        e.stopPropagation();
        next();
      }}
    >
      {children}
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
  const [env] = useEnv();
  const isLogin = useIsLogin()[0];
  const list = useMemo(() => {
    const list = (ArrayEnv.NAV || []).concat();
    list.push({ name: "admin", url: "admin" });
    list.push({ name: "theme", switch: "theme" });
    return list;
  }, [env, isLogin]);
  return (
    <div className="siteMenu en-title-font">
      <DropdownObject
        listClassName="right"
        MenuButton={SiteMenuButton}
        onClickFadeOutTime={300}
      >
        {list.map((item, i) => {
          if (item.url) {
            if (item.out) {
              return (
                <a key={i} href={item.url} className="item">
                  {(item.short || item.name).toUpperCase()}
                </a>
              );
            } else {
              return (
                <Link key={i} to={item.url} className="item">
                  {(item.short || item.name).toUpperCase()}
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
      </DropdownObject>
    </div>
  );
}
