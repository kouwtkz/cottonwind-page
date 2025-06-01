import React from "react";
import { Link } from "react-router";
import type { Route } from "../+types/root";
import { TITLE_IMAGE_PATH } from "~/envDef";

export function SiteTitle({ loaderData }: Route.ComponentProps) {
  const title = loaderData.title;
  console.log(loaderData.image);
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

export function HeaderClient(props: Route.ComponentProps) {
  return (
    <header id="header" className="siteHeader">
      {/* <BackButton className="backButton" /> */}
      <SiteTitle {...props} />
      {/* <SiteMenu /> */}
      <div className="headerBackground" />
    </header>
  );
}
