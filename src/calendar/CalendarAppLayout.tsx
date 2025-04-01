import { Style } from "@/serverLayout";

interface CalendarLayoutProps {
  script?: React.ReactNode;
  beforeScript?: React.ReactNode;
  children?: React.ReactNode;
}
export function CalendarAppLayout({
  children,
  script,
  beforeScript,
}: CalendarLayoutProps) {
  return (
    <html lang="ja" className="loading">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/assets/faviconCalendar.ico" />
        <title>めぇ式カレンダー</title>
        {beforeScript}
        <Style href="/assets/styles.css" />
        <Style href="/assets/styles_lib.css" />
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
