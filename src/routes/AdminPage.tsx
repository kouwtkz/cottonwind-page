import { HTMLAttributes, useEffect, useMemo } from "react";
import { useApiOrigin, useIsLogin, useMediaOrigin } from "@/state/EnvState";
import { Link, useParams } from "react-router-dom";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog, fileDownload } from "@/components/FileTool";
import { filesDataObject } from "@/state/DataState";
import { MdFileUpload, MdOpenInNew } from "react-icons/md";
import { FilesEdit, FilesUpload, useEditFileID } from "./edit/FilesEdit";
import { useFiles } from "@/state/FileState";
import { concatOriginUrl } from "@/functions/originUrl";
import { ImagesManager } from "./edit/ImagesManager";
import { AiFillEdit } from "react-icons/ai";
import JSZip from "jszip";
import { LinkButton } from "@/components/button/LinkButton";
import { useImageState } from "@/state/ImageState";
import { findMee } from "@/functions/find/findMee";
import { useToastProgress } from "@/state/ToastProgress";

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
          <h2 className="color-main en-title-font">Admin room</h2>
          <h4>かんりしつ</h4>
          <div className="flex center column large">
            {isLogin ? (
              <>
                <a href="/workers">Workersのページ</a>
                <Link to="images">画像管理ページ</Link>
                <Link to="files">ファイル管理ページ</Link>
                <Link to="zip">Zipアーカイブ</Link>
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
    case "zip":
      return <ZipPage />;
    default:
      return <></>;
  }
}

function FilesManager() {
  const apiOrigin = useApiOrigin()[0];
  const mediaOrigin = useMediaOrigin()[0];
  const setFilesLoad = filesDataObject.useLoad()[1];
  const [edit, setEdit] = useEditFileID();
  const files = useFiles()[0];
  return (
    <>
      {edit ? (
        <FilesEdit edit={edit} setEdit={setEdit} dataObject={filesDataObject} />
      ) : null}
      <RbButtonArea>
        <button
          type="button"
          className="color round large"
          title="ファイルのアップロード"
          onClick={async () => {
            fileDialog("*", true)
              .then((files) => Array.from(files))
              .then((files) =>
                FilesUpload({ send: "/file/send", files, apiOrigin })
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
        <ul className="files">
          {files?.map((file, i) => {
            return (
              <li key={i} tabIndex={-1}>
                <div className="name">{file.key}</div>
                <button
                  type="button"
                  title="編集する"
                  className="color-main miniIcon margin"
                  onClick={(e) => {
                    setEdit(file.id);
                    e.preventDefault();
                  }}
                >
                  <AiFillEdit />
                </button>
                <a
                  className="open"
                  title="ファイルを開く"
                  target="file"
                  href={concatOriginUrl(mediaOrigin, file.src)}
                >
                  <MdOpenInNew />
                </a>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

function ZipPage() {
  const mediaOrigin = useMediaOrigin()[0];
  const { images } = useImageState();
  const { setMax, addProgress } = useToastProgress();
  const countImagesDL = 100;
  return (
    <>
      <h2 className="color-main en-title-font">Zip archive</h2>
      <h4>アーカイブのダウンロードページ</h4>
      <div className="flex center column large">
        <LinkButton
          onClick={async () => {
            if (
              images &&
              confirm(`最新の画像を${countImagesDL}件ダウンロードしますか？`)
            ) {
              const zip = new JSZip();
              const list = findMee(images, {
                orderBy: [{ time: "desc" }],
                take: countImagesDL,
              }).reduce<string[]>((a, item) => {
                if (item.src) a.push(item.src);
                if (item.thumbnail) a.push(item.thumbnail);
                return a;
              }, []);
              setMax(list.length + 1);
              Promise.all(
                list.map((src) =>
                  fetch(concatOriginUrl(mediaOrigin, src), {
                    cache: "no-cache",
                  })
                    .then((r) => r.blob())
                    .then((blob) => {
                      zip.file(src, blob);
                    })
                    .finally(() => {
                      addProgress();
                    })
                )
              )
                .then(() => zip.generateAsync({ type: "blob" }))
                .then((content) => {
                  fileDownload(`latestImage_${countImagesDL}.zip`, content);
                })
                .finally(() => {
                  addProgress();
                });
            }
          }}
        >
          最新の画像{countImagesDL}件
        </LinkButton>
      </div>
    </>
  );
}
