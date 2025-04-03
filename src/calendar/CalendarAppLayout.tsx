import { Style } from "@/serverLayout";

interface LayoutPropsWithChildren extends CalendarAppLayoutProps {
  children?: React.ReactNode;
}
export function CalendarAppLayout({
  children,
  headScript,
  bodyScript,
  meta,
}: LayoutPropsWithChildren) {
  return (
    <html lang="ja" className="loading">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/faviconCalendar.ico" />
        <title>めぇ式カレンダー</title>
        {meta}
        <script
          type="module"
          src={import.meta.env?.VITE_CLIENT_BEFORE_SCRIPT}
        />
        {headScript}
        <script type="module" src={import.meta.env?.VITE_CLIENT_SCRIPT} />
        <Style href="/assets/styles.css" />
        <Style href="/assets/styles_lib.css" />
        <link
          rel="manifest"
          href="/manifest.json"
          crossOrigin="use-credentials"
        />
      </head>
      <body>
        {children}
        {bodyScript}
      </body>
    </html>
  );
}

export function CalendarAppNotFound() {
  return <CalendarAppLayout>ページが見つかりませんでした</CalendarAppLayout>;
}
