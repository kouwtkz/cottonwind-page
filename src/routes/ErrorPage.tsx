import { Link, useRouteError } from "react-router-dom";
import { Base } from "./Root";

const errorList: {
  [k: string | number]: { h1: string; h4: string } | undefined;
} = {
  404: {
    h1: "404 not found",
    h4: "ページが見つかりませんでした",
  },
};

type ErrorType = {
  status?: number;
  statusText?: string;
  internal?: boolean;
  data?: string;
  error?: Error;
};

export function ErrorContent({ status, statusText }: ErrorType) {
  const errorObj = status ? errorList[status] : null;
  return (
    <div className="color-main en-title-font middle">
      {errorObj ? (
        <>
          <h1>{errorObj.h1}</h1>
          <h4>{errorObj.h4}</h4>
          <Link to="/">トップページへ戻る</Link>
        </>
      ) : (
        <>
          <h1>Error</h1>
          <h4>{statusText}</h4>
          <Link to="/">トップページへ戻る</Link>
        </>
      )}
    </div>
  );
}

export default function ErrorPage() {
  const error = useRouteError() as ErrorType;
  console.log(error);
  return (
    <Base>
      <ErrorContent {...error} />
    </Base>
  );
}
