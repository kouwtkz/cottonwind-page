import React from "react";
import { Link } from "react-router-dom";
import BackButton from "./BackButton";
import { SiteMenu } from "@/layout/SiteMenu";
import { useLang } from "@/multilingual/LangState";
import {
  defaultLang,
  TITLE_IMAGE_PATH,
  TITLE_IMAGE_PATH_EN,
} from "@/multilingual/envDef";

export function SiteTitle({ env }: { env?: SiteConfigEnv }) {
  const lang = useLang()[0];
  const title =
    (lang === defaultLang ? env?.TITLE : env?.TITLE_EN) ??
    (typeof document !== "undefined" ? document.title : "");

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

export function HeaderClient({ env }: { env?: SiteConfigEnv }) {
  return (
    <header id="header" className="siteHeader">
      <BackButton className="backButton" />
      <SiteTitle env={env} />
      <SiteMenu />
      <div className="headerBackground" />
    </header>
  );
}
