import React from "react";
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
      <Link
        id="siteTitle"
        to="/"
        onClick={(e) => {
          if (scrollY > 0) {
            scrollTo({ top: 0, behavior: "smooth" });
            e.preventDefault();
          }
        }}
      >
        {title}
      </Link>
    </div>
  );
});

export function Header() {
  return (
    <header id="header">
      <div>
        <BackButton className="backButton" />
        <SiteTitle title={import.meta.env.VITE_TITLE} />
        <SiteMenuButton />
        <SiteMenu />
      </div>
      <div className="headerBackground" />
    </header>
  );
}
