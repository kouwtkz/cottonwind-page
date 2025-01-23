import { HTMLAttributes, useEffect, useMemo } from "react";
import { useApiOrigin, useIsLogin, useMediaOrigin } from "@/state/EnvState";
import { Link, useParams } from "react-router-dom";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog, fileDownload } from "@/components/FileTool";
import { allDataLoadState, filesDataObject } from "@/state/DataState";
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
import { arrayPartition, PromiseOrder } from "@/functions/arrayFunction";
import { useSounds } from "@/state/SoundState";
import { toast } from "react-toastify";
import axios from "axios";

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
                <Link to="db">データベース設定</Link>
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
    case "db":
      return <DBPage />;
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
  return (
    <>
      <h2 className="color-main en-title-font">Zip archive</h2>
      <h4>アーカイブのダウンロードページ</h4>
      <div className="flex center column large">
        <ImageFilesDownload take={100} />
        <ImageFilesDownload />
        <FilesDownload />
        <SoundFilesDownload />
      </div>
    </>
  );
}

interface DownloadBaseProps {
  take?: number;
}
interface MediaDownloadProps extends DownloadBaseProps {
  list?: string[];
  name: string;
  label: string;
}

function ImageFilesDownload({ take, ...props }: DownloadBaseProps) {
  const { images } = useImageState();
  const list = useMemo(
    () =>
      findMee(images || [], {
        orderBy: [{ time: "desc" }],
        take,
      }).reduce<string[]>((a, item) => {
        if (item.src) a.push(item.src);
        if (item.thumbnail) a.push(item.thumbnail);
        return a;
      }, []),
    [images, take]
  );
  return (
    <MediaDownload
      list={list}
      label="画像"
      name="images"
      take={take}
      {...props}
    />
  );
}

function FilesDownload({ take, ...props }: DownloadBaseProps) {
  const files = useFiles()[0];
  const list = useMemo(
    () =>
      findMee(files || [], {
        orderBy: [{ mtime: "desc" }],
        take,
      }).reduce<string[]>((a, item) => {
        if (item.src) a.push(item.src);
        return a;
      }, []),
    [files, take]
  );
  return (
    <MediaDownload
      list={list}
      label="添付ファイル"
      name="files"
      take={take}
      {...props}
    />
  );
}

function SoundFilesDownload({ take, ...props }: DownloadBaseProps) {
  const sounds = useSounds()[0];
  const list = useMemo(
    () =>
      findMee(sounds || [], {
        orderBy: [{ mtime: "desc" }],
        take,
      }).reduce<string[]>((a, item) => {
        if (item.src) a.push(item.src);
        return a;
      }, []),
    [sounds, take]
  );
  return (
    <MediaDownload
      list={list}
      label="音楽"
      name="sounds"
      take={take}
      {...props}
    />
  );
}

function MediaDownload({ list, take, name, label }: MediaDownloadProps) {
  const mediaOrigin = useMediaOrigin()[0];
  const { setMax, addProgress } = useToastProgress();
  const isAll = useMemo(() => typeof take !== "number", [take]);
  return (
    <LinkButton
      onClick={async () => {
        if (
          list &&
          confirm(
            (isAll ? `${label}を全件` : `最新の${label}を${take}件`) +
              "ダウンロードしますか？"
          )
        ) {
          const zip = new JSZip();
          setMax(list.length + 1);
          PromiseOrder(
            arrayPartition(list, 100).map(
              (list) => () =>
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
            ),
            { sleepTime: 100 }
          )
            .then(() => zip.generateAsync({ type: "blob" }))
            .then((content) => {
              fileDownload(
                isAll ? `files_${name}.zip` : `latest_${name}_${take}.zip`,
                content
              );
            })
            .finally(() => {
              addProgress();
            });
        }
      }}
    >
      {isAll ? `全ての${label}` : `最新の${label}${take}件`}
    </LinkButton>
  );
}

function DBPage() {
  const apiOrigin = useApiOrigin()[0];
  const setAllLoad = allDataLoadState()[1];
  return (
    <>
      <h2 className="color-main en-title-font">DB Setting</h2>
      <h4>データベースの設定ページ</h4>
      <div className="flex center column large">
        <a
          href="./"
          onClick={(e) => {
            e.preventDefault();
            if (
              confirm(
                "互換用のプログラムです。\n" +
                  "サーバーのデータベースに現在のテーブルの" +
                  "バージョンを全て更新しますか？"
              )
            ) {
              toast.promise(
                axios
                  .post(
                    concatOriginUrl(
                      apiOrigin,
                      "data/tables/update"
                    ),
                    {
                      withCredentials: true,
                    }
                  )
                  .then(() => {
                    setAllLoad(true);
                  }),
                {
                  pending: "記録中",
                  success: "記録しました",
                  error: "送信に失敗しました",
                }
              );
            }
          }}
        >
          現在のテーブルのバージョンを全て更新する
        </a>
      </div>
    </>
  );
}
