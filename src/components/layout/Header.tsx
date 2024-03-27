import React from "react";
import { serverSite } from "../../data/server/site";
import { Link } from "react-router-dom";
import BackButton from "./BackButton";
import { SiteMenu, SiteMenuButton } from "../../state/SiteMenu";

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
  return (
    <header id="header">
      <div>
        <BackButton className="backButton" />
        <SiteTitle title={serverSite.title} />
        <SiteMenuButton />
        <SiteMenu />
      </div>
      <div className="headerBackground" />
    </header>
  );
}
