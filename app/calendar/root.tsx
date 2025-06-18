import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
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

interface LayoutProps {
  children?: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  return (
    <html lang={DEFAULT_LANG}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
      <Scripts />
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
