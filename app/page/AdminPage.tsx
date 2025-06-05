import { useEffect, useMemo } from "react";
import { useIsLogin } from "~/components/state/EnvState";
import { Link, useParams } from "react-router";
import { RbButtonArea } from "~/components/dropdown/RbButtonArea";
import { fileDialog, fileDownload } from "~/components/utility/FileTool";
import {
  filesDataIndexed,
  keyValueDBDataIndexed,
  tableVersionDataIndexed,
  IdbStateClassList,
  apiOrigin,
  mediaOrigin,
} from "~/data/ClientDBLoader";
import {
  ImportImagesJson,
  ImportCharacterJson,
  ImportCommonJson,
  ImportLinksJson,
  ImportPostJson,
} from "~/data/ClientDBFunctions";

import { MdFileUpload, MdOpenInNew } from "react-icons/md";
import { FilesEdit, FilesUpload, useEditFileID } from "./edit/FilesEdit";
import { useFiles } from "~/components/state/FileState";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { ImagesManager } from "./edit/ImagesManager";
import { AiFillEdit } from "react-icons/ai";
import { LinkButton } from "~/components/button/LinkButton";
import { findMee } from "~/data/find/findMee";
import { useToastProgress } from "~/components/state/ToastProgress";
import {
  arrayPartition,
  PromiseOrder,
} from "~/components/functions/arrayFunction";
import { useSounds } from "~/components/state/SoundState";
import { toast } from "react-toastify";
import {
  DownloadDataObject,
  getIndexedDBJsonOptions,
} from "~/components/button/ObjectDownloadButton";
import {
  charactersDataOptions,
  ImageDataOptions,
  KeyValueDBDataOptions,
  linksDataOptions,
  linksFavDataOptions,
  postsDataOptions,
} from "~/data/DataEnv";
import { useCharacters } from "~/components/state/CharacterState";
import { FormatDate } from "~/components/functions/DateFunction";
import { KeyValueEditable } from "~/components/state/KeyValueDBState";
import { useImageState } from "~/components/state/ImageState";
import { corsFetch } from "~/components/functions/fetch";

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
          <div className="flex center column font-larger">
            {isLogin ? <AdminMainPage /> : null}
          </div>
        </>
      )}
    </main>
  );
}

export function AdminMainPage() {
  return (
    <>
      <a href="/workers">Workersのページ</a>
      <Link to="/admin/images">画像管理ページ</Link>
      <Link to="/admin/files">ファイル管理ページ</Link>
      <Link to="/admin/zip">Zipアーカイブ</Link>
      <Link to="/admin/db">データベース設定</Link>
      <Link to="/admin/schedule">スケジュール設定</Link>
      <a href="/workers/logout">ログアウト</a>
    </>
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
    case "schedule":
      return <ScheduleManager />;
    default:
      return <></>;
  }
}

function FilesManager() {
  const [edit, setEdit] = useEditFileID();
  const { files } = useFiles();
  return (
    <>
      {edit ? <FilesEdit edit={edit} setEdit={setEdit} /> : null}
      <RbButtonArea>
        <button
          type="button"
          className="color round font-larger"
          title="ファイルのアップロード"
          onClick={async () => {
            fileDialog("*", true)
              .then((files) => Array.from(files))
              .then((files) =>
                FilesUpload({ send: "/file/send", files, apiOrigin })
              )
              .then(() => {
                filesDataIndexed.load("no-cache");
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
      <div className="flex center column font-larger">
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
  const { files } = useFiles();
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
  const { sounds } = useSounds();
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
  const { charactersMap } = useCharacters();
  return (
    <>
      <h2 className="color-main en-title-font">DB Setting</h2>
      <h4>データベースの設定ページ</h4>
      <div className="flex center column font-larger">
        <a
          href="./"
          onClick={(e) => {
            e.preventDefault();
            (async function () {
              const currentVersionMap = new Map(
                (
                  await tableVersionDataIndexed?.table.find({
                    where: { key: { not: "tables" } },
                  })
                ).map((v) => [v.key, v])
              );
              const newVersions = findMee(IdbStateClassList, {
                where: { key: { not: "tables" } },
              }).filter(
                (v) => v.version !== currentVersionMap.get(v.key)?.version
              );
              if (newVersions.length === 0) {
                toast("データベースは最新です");
              } else {
                const count = newVersions.length;
                const strList = newVersions.map((v) => v.key).join(", ");
                let updateString = `データベースのテーブルの更新が${count}件(${strList})あります！\n`;
                const needAlterTableList = newVersions.filter((v) => {
                  const m = v.options.version.match(/\d+.\d+/);
                  const nm = v.version.match(/\d+.\d+/);
                  return m && nm && m[0] !== nm[0];
                });
                const currentDate = new Date();
                if (needAlterTableList.length > 0) {
                  const count = needAlterTableList.length;
                  const strList = needAlterTableList
                    .map((v) => v.key)
                    .join(", ");
                  updateString =
                    updateString +
                    `そのうち${count}件(${strList})は` +
                    `テーブルを作り直す必要があります。\n` +
                    "（バックアップ用のダウンロードも行います）\n";
                }
                if (
                  confirm(
                    updateString + "データベースのテーブルを全て更新しますか？"
                  )
                ) {
                  const list = needAlterTableList.map(async (object) => {
                    const json = await getIndexedDBJsonOptions(object);
                    DownloadDataObject({
                      ...json,
                      name: object.key + "_" + FormatDate(currentDate, "Ymd"),
                    });
                    switch (object.key) {
                      case ImageDataOptions.name:
                        return ImportImagesJson({
                          charactersMap,
                          overwrite: true,
                          json,
                        });
                      case charactersDataOptions.name:
                        return ImportCharacterJson({
                          json,
                        });
                      case postsDataOptions.name:
                        return ImportPostJson({
                          json,
                        });
                      case linksDataOptions.name:
                        return ImportLinksJson({
                          json,
                        });
                      case linksFavDataOptions.name:
                        return ImportLinksJson({
                          json,
                          dir: "/fav",
                        });
                      case keyValueDBDataIndexed.key:
                        return ImportCommonJson({
                          options: KeyValueDBDataOptions,

                          json,
                        });
                      default:
                        toast(`${object.key}は現在インポートの実装待ちです…`);
                        return;
                    }
                  });
                  Promise.all(list)
                    .then(() => {
                      return toast.promise(
                        corsFetch(
                          concatOriginUrl(apiOrigin, "data/tables/update"),
                          { method: "POST" }
                        ),
                        {
                          pending: "送信中",
                          success: "更新しました！",
                          error: "送信に失敗しました",
                        }
                      );
                    })
                    .then(() => {
                      // allLoad(true);
                    });
                }
              }
            })();
          }}
        >
          現在のテーブルのバージョンを全て更新する
        </a>
      </div>
    </>
  );
}

function ScheduleManager() {
  return (
    <>
      <h2 className="color-main en-title-font">Schedule Manager</h2>
      <KeyValueEditable
        title="Google Calendar ID の追加設定"
        editKey="google-calendar-id-2"
      />
    </>
  );
}
