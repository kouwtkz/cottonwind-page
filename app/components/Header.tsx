import React, { useMemo } from "react";
import { Link } from "react-router";
import { defaultLang, TITLE_IMAGE_PATH, TITLE_IMAGE_PATH_EN } from "~/Env";
import type { OmittedEnv } from "types/custom-configuration";
import BackButton from "./layout/BackButton";
import { SiteMenu } from "./layout/SiteMenu";
import { useLang } from "./multilingual/LangState";

interface HeaderProps {
  env?: Partial<OmittedEnv>;
}
export function SiteTitle({ env }: HeaderProps) {
  const lang = useLang()[0];
  const title = useMemo(
    () =>
      (lang === defaultLang ? env?.TITLE : env?.TITLE_EN) ??
      (typeof document !== "undefined" ? document.title : ""),
    [lang]
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
          {lang === defaultLang && TITLE_IMAGE_PATH ? (
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

export function HeaderClient(props: HeaderProps) {
  return (
    <header id="header" className="siteHeader">
      <BackButton className="backButton" />
      <SiteTitle {...props} />
      <SiteMenu />
      <div className="headerBackground" />
    </header>
  );
}
