import React from "react";
import { Link } from "react-router-dom";
import BackButton from "./BackButton";
import { SiteMenu } from "@/state/SiteMenu";

export function SiteTitle({ title }: { title: string }) {
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
          <img
            src="/static/images/webp/cottonwind_logo_min.webp"
            alt={title}
          />
        </h2>
      </Link>
    </div>
  );
}

export function HeaderClient({ env }: { env?: SiteConfigEnv }) {
  return (
    <header id="header">
      <BackButton className="backButton" />
      <SiteTitle
        title={
          env?.TITLE ?? typeof document !== "undefined" ? document.title : ""
        }
      />
      <SiteMenu />
      <div className="headerBackground" />
    </header>
  );
}
