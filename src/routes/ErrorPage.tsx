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

export default function ErrorPage() {
  let error: {
    status: number;
    statusText: string;
    internal: boolean;
    data: string;
    error: Error;
  } = useRouteError() as any;
  const errorObj = errorList[error.status];
  return (
    <Base>
      <div className="h1h4Page middle">
        {errorObj ? (
          <>
            <h1>{errorObj.h1}</h1>
            <h4>{errorObj.h4}</h4>
            <Link to="/">トップページへ戻る</Link>
          </>
        ) : (
          <>
            <h1>Error</h1>
            <h4>{error.statusText}</h4>
            <Link to="/">トップページへ戻る</Link>
          </>
        )}
      </div>
    </Base>
  );
}
