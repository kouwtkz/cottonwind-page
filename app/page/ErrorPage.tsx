import { isRouteErrorResponse, Link } from "react-router";

interface ErrorBoundaryContentProps {
  error: unknown;
}
export function ErrorBoundaryContent({ error }: ErrorBoundaryContentProps) {
  let message = "めぇ！（エラー）";
  let details: string | undefined;
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }
  return (
    <div className="content-base">
      <main className="color en-title-font middle">
        <h1>{message}</h1>
        {details ? <h4>{details}</h4> : null}
        <a href="/">トップページへ戻る</a>
        {stack && (
          <pre>
            <code>{stack}</code>
          </pre>
        )}
      </main>
    </div>
  );
}
