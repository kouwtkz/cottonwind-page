import {
  Links,
  Meta,
  Scripts,
  useRouteLoaderData,
  type LinkDescriptor,
} from "react-router";
import type { Route } from "./+types/root";
import type { MetaValuesType } from "~/components/utils/SetMeta";
import { ClickEffect } from "~/components/click/ClickEffect";
import { ClickEventState } from "~/components/click/useClickEvent";
import { Theme } from "~/components/theme/Theme";
import { ToastContainer } from "react-toastify";
import { ToastProgressState } from "~/components/state/ToastProgress";
import { defaultToastContainerOptions } from "~/components/define/toastContainerDef";
import { CalendarRoot } from "./client";
import { ErrorBoundaryContent } from "~/page/ErrorPage";
import { DEFAULT_LANG } from "~/Env";
import { useEffect, useMemo } from "react";
import { getCookieObjectFromHeaders } from "~/components/utils/Cookie";
import { CookieToThemeClassNames } from "~/components/theme/ThemeCookie";

export function links(): LinkDescriptor[] {
  return [
    { rel: "stylesheet", href: import.meta.env.VITE_CSS_STYLES },
    { rel: "stylesheet", href: import.meta.env.VITE_CSS_LIB },
    { rel: "icon", href: "/faviconCalendar.ico" },
    { rel: "manifest", href: "/manifest.json", crossOrigin: "use-credentials" },
  ];
}

export function meta() {
  return [
    { title: "めぇ式カレンダー" },
    { description: "こっとんうぃんどによるカレンダーアプリです！" },
  ] as MetaValuesType[];
}

export async function loader({ request }: Route.LoaderArgs) {
  return {
    cookie: getCookieObjectFromHeaders(request),
  };
}

interface LayoutProps {
  children?: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  const data = useRouteLoaderData("root");
  const className = useMemo(() => {
    const classNames: string[] = [];
    if (data?.cookie) {
      CookieToThemeClassNames(data.cookie).forEach((item) => {
        classNames.push(item);
      });
    }
    return classNames.join(" ");
  }, [data?.cookie]);
  return (
    <html lang={DEFAULT_LANG} className={className}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {import.meta.env.PROD ? (
          <script src={import.meta.env.VITE_SSG_BEFORE_CLIENT} />
        ) : null}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App({
  loaderData,
  ...e
}: Route.ComponentProps): React.ReactNode {
  return (
    <>
      <ClickEffect />
      <ClickEventState />
      <Theme />
      <ToastContainer {...defaultToastContainerOptions} />
      <ToastProgressState />
      <CalendarRoot />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <body>
      <ErrorBoundaryContent error={error} />
    </body>
  );
}
