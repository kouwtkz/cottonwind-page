import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SiteMenuButton } from "@src/components/svg/button/MenuButton";
import { DropdownObject } from "@src/components/dropdown/DropdownMenu";
import { useEnv, useIsLogin } from "@src/state/EnvState";
import { ArrayEnv } from "@src/Env";
import { ClickEffectSwitchButton } from "@src/components/click/ClickEffect";
import {
  DarkThemeChangeButton,
  ThemeChangeButton,
} from "@src/components/theme/Theme";

export function SiteMenuSwitchButtons({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  className = useMemo(() => {
    const classNames = ["switch"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  return (
    <div {...props} className={className}>
      <ClickEffectSwitchButton />
      <ThemeChangeButton />
      <DarkThemeChangeButton />
    </div>
  );
}

export function SiteMenu() {
  const [env] = useEnv();
  const isLogin = useIsLogin()[0];
  const list = useMemo(() => {
    const list = (ArrayEnv.NAV || []).concat();
    list.push({ name: "setting", url: "setting" });
    list.push({ name: "theme", switch: "theme" });
    return list;
  }, [env, isLogin]);
  return (
    <div className="siteMenu en-title-font">
      <DropdownObject
        classNames={{ dropItemList: "right" }}
        MenuButton={SiteMenuButton}
        cssTimeOut={100}
        keepActiveOpen
        coverZIndex={-1}
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
                  return <SiteMenuSwitchButtons key={i} />;
              }
            }
          }
        })}
      </DropdownObject>
    </div>
  );
}
