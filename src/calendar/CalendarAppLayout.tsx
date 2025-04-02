import { Style } from "@/serverLayout";

interface LayoutPropsWithChildren extends CalendarAppLayoutProps {
  children?: React.ReactNode;
}
export function CalendarAppLayout({
  children,
  script,
  beforeScript,
  meta,
}: LayoutPropsWithChildren) {
  return (
    <html lang="ja" className="loading">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/faviconCalendar.ico" />
        <title>めぇ式カレンダー</title>
        {beforeScript}
        <Style href="/assets/styles.css" />
        <Style href="/assets/styles_lib.css" />
        {meta}
        <link
          rel="manifest"
          href="/manifest.json"
          crossOrigin="use-credentials"
        />
      </head>
      <body>
        {children}
        {script}
      </body>
    </html>
  );
}

export function CalendarAppNotFound() {
  return <CalendarAppLayout>ページが見つかりませんでした</CalendarAppLayout>;
}
