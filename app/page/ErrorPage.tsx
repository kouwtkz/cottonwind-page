import React, { useEffect, useMemo } from "react";
import { isRouteErrorResponse, Link } from "react-router";

interface ErrorBoundaryContentProps {
  error?: unknown;
  className?: string;
}
export const ErrorBoundaryContent = React.memo(function ErrorBoundaryContent({
  error,
  className,
}: ErrorBoundaryContentProps) {
  className = useMemo(() => {
    const classNames = ["errorPage content-base"];
    if (className) classNames.push(className);
    return classNames.join(" ");
  }, [className]);
  let message = "めぇ！（エラー）";
  let details: string | undefined;
  let stack: string | undefined;
  useEffect(() => {
    if (error) {
      const html = document.querySelector("html");
      if (html) {
        html.classList.remove("loading", "dummy");
      }
    }
    console.log(error);
  }, [error]);
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else {
    if (import.meta.env.DEV && error && error instanceof Error) {
      details = error.message;
      stack = error.stack;
    }
    if (!details) details = String(error);
  }
  return (
    <div className={className}>
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
});
