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
    <html lang="ja" className="loading">
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
  let message = "めぇ！（エラー）";
  let details = "エラーです…！";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "ページが見つかりませんでした"
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <body>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </body>
  );
}
