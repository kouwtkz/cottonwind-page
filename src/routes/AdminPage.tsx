import { useEffect } from "react";
import { useApiOrigin, useIsLogin, useMediaOrigin } from "@/state/EnvState";
import { Link, useParams } from "react-router-dom";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog } from "@/components/FileTool";
import {
  filesDataObject,
} from "@/state/DataState";
import {
  MdFileUpload,
} from "react-icons/md";
import { FilesUpload } from "./edit/FilesEdit";
import { useFiles } from "@/state/FileState";
import { concatOriginUrl } from "@/functions/originUrl";
import { ImagesManager } from "./edit/ImagesManager";

export function AdminPage() {
  const isLogin = useIsLogin()[0];
  useEffect(() => {
    if (isLogin !== undefined && !isLogin) location.href = "/workers/login";
  }, [isLogin]);
  const params = useParams();
  return (
    <main className="h1h4Page">
      {params.key ? (
        <AdminDetailPage param={params.key} />
      ) : (
        <>
          <h2 className="color en-title-font">Admin room</h2>
          <h4>かんりしつ</h4>
          <div className="flex center column large">
            {isLogin ? (
              <>
                <a href="/workers">Workersのページ</a>
                <Link to="images">画像管理ページ</Link>
                <Link to="files">ファイル管理ページ</Link>
                <a href="/workers/logout">ログアウト</a>
              </>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}

export function AdminDetailPage({ param }: { param: string }) {
  switch (param) {
    case "images":
      return <ImagesManager />;
    case "files":
      return <FilesManager />;
    default:
      return <></>;
  }
}

function FilesManager() {
  const apiOrigin = useApiOrigin()[0];
  const mediaOrigin = useMediaOrigin()[0];
  const setFilesLoad = filesDataObject.useLoad()[1];
  const files = useFiles()[0];
  return (
    <>
      <RbButtonArea>
        <button
          type="button"
          className="color round large"
          title="ファイルのアップロード"
          onClick={async () => {
            fileDialog("*", true)
              .then((files) => Array.from(files))
              .then((files) =>
                FilesUpload({ path: "/file/send", files, apiOrigin })
              )
              .then(() => {
                setFilesLoad("no-cache");
              });
          }}
        >
          <MdFileUpload />
        </button>
      </RbButtonArea>
      <main>
        <h2 className="color-main en-title-font">File Manager</h2>
        <div className="flex column">
          {files?.map((file, i) => {
            return (
              <div key={i}>
                <a target="file" href={concatOriginUrl(mediaOrigin, file.src)}>
                  {file.key}
                </a>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
