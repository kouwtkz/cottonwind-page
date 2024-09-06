import React from "react";
import { Link } from "react-router-dom";
import BackButton from "./BackButton";
import { SiteMenu } from "@/state/SiteMenu";
import { ImageMee } from "./ImageMee";
import { useAtom } from "jotai";
import { EnvAtom } from "@/state/EnvState";

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
        <h2>
          <ImageMee
            src="/static/images/webp/cottonwind_logo_min.webp"
            alt={title}
          />
        </h2>
      </Link>
    </div>
  );
});

export function Header() {
  const [env] = useAtom(EnvAtom);
  return (
    <header id="header">
      <BackButton className="backButton" />
      <SiteTitle title={env?.TITLE ?? document.title} />
      <SiteMenu />
      <div className="headerBackground" />
    </header>
  );
}
