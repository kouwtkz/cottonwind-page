import React from "react";
import { Link } from "react-router-dom";
import MenuButton from "../components/svg/button/MenuButton";
import { create } from "zustand";
import { ThemeChangeButton } from "./ThemeSetter";
import { serverSite as site } from "../data/server/site";
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

const SetSiteMenu = React.memo(function SiteMenu({
  nav,
}: {
  nav: SiteMenuItemType[];
}) {
  const { SetIsOpen } = useSiteMenuState();
  return (
    <div className="siteMenu">
      {nav.map((item, i) => {
        if (item.url)
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
        else {
          switch (item.switch) {
            case "theme":
              return (
                <ThemeChangeButton key={i} className="item theme">
                  {item.name}
                </ThemeChangeButton>
              );
          }
        }
      })}
    </div>
  );
});

export function SiteMenu() {
  const { isOpen } = useSiteMenuState();
  return (
    <>
      {site.menu?.nav ? (
        <div style={isOpen ? {} : { display: "none" }}>
          <SetSiteMenu nav={site.menu.nav} />
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
