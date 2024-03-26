import React from "react";
import { serverSite } from "../../data/server/site";
import { Link } from "react-router-dom";
import BackButton from "./BackButton";

export const SiteTitle = React.memo(function SiteTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div className="title-container">
      <Link to="/">
        <div id="siteTitle">{title}</div>
      </Link>
    </div>
  );
});

export function Header() {
  // console.log(import.meta.env);
  return (
    <header id="header">
      <div>
        {/* <SiteMenuButton /> */}
        <BackButton className="backButton" />
        <SiteTitle title={serverSite.title} />
        {/* <SiteMenu /> */}
      </div>
      <div className="headerBackground" />
    </header>
  );
}
