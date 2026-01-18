import React, { useMemo } from "react";
import { Link } from "react-router";
import {
  DEFAULT_LANG,
  TITLE,
  TITLE_EN,
  TITLE_IMAGE_PATH,
  TITLE_IMAGE_PATH_EN,
} from "~/Env";
import BackButton from "./layout/BackButton";
import { SiteMenu } from "./layout/SiteMenu";
import { useLang } from "./multilingual/LangState";

interface HeaderProps {
  hideBackButton?: boolean;
  hideSiteMenu?: boolean;
}
export function SiteTitle() {
  const lang = useLang()[0];
  const title = useMemo(
    () =>
      (lang === DEFAULT_LANG ? TITLE : TITLE_EN) ??
      (typeof document !== "undefined" ? document.title : ""),
    [lang],
  );

  return (
    <div className="title-container">
      <Link
        id="siteTitle"
        to="/"
        title={title}
        onClick={(e) => {
          if (scrollY > 0) {
            scrollTo({ top: 0, behavior: "smooth" });
            e.preventDefault();
          }
        }}
      >
        <h1>
          {lang === DEFAULT_LANG && TITLE_IMAGE_PATH ? (
            <img src={TITLE_IMAGE_PATH} alt={title} />
          ) : TITLE_IMAGE_PATH_EN ? (
            <img src={TITLE_IMAGE_PATH_EN} alt={title} />
          ) : (
            title
          )}
        </h1>
      </Link>
    </div>
  );
}

export const HeaderClient = React.memo(function HeaderClient({
  hideBackButton,
  hideSiteMenu,
}: HeaderProps) {
  return (
    <header id="header" className="siteHeader">
      {hideBackButton ? null : <BackButton className="backButton" />}
      <SiteTitle />
      {hideSiteMenu ? null : <SiteMenu />}
      <div className="headerBackground" />
    </header>
  );
});
