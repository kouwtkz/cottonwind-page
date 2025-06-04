import React from "react";
import { Link } from "react-router";
import { TITLE_IMAGE_PATH } from "~/Env";
import type { OmittedEnv } from "types/custom-configuration";

interface HeaderProps {
  env?: Partial<OmittedEnv>;
}
export function SiteTitle({ env }: HeaderProps) {
  const title = env?.TITLE;
  // const lang = useLang()[0];
  // const title =
  //   (lang === defaultLang ? env?.TITLE : env?.TITLE_EN) ??
  //   (typeof document !== "undefined" ? document.title : "");

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
          <img src={TITLE_IMAGE_PATH} alt={title} />
          {/* {lang === defaultLang && TITLE_IMAGE_PATH ? (
            <img src={TITLE_IMAGE_PATH} alt={title} />
          ) : TITLE_IMAGE_PATH_EN ? (
            <img src={TITLE_IMAGE_PATH_EN} alt={title} />
          ) : ( */}
          {/* {title} */}
          {/* )} */}
        </h1>
      </Link>
    </div>
  );
}

export function HeaderClient(props: HeaderProps) {
  return (
    <header id="header" className="siteHeader">
      {/* <BackButton className="backButton" /> */}
      <SiteTitle {...props} />
      {/* <SiteMenu /> */}
      <div className="headerBackground" />
    </header>
  );
}
