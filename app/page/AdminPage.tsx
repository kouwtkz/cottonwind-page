import { useMemo } from "react";
import { useIsLogin } from "~/components/state/EnvState";
import { Link, useNavigate, useParams } from "react-router";
import { fileDownload } from "~/components/utils/FileTool";
import {
  IdbStateClassList,
  apiOrigin,
  mediaOrigin,
  redirectDataIndexed,
} from "~/data/ClientDBLoader";
import {
  ImportImagesJson,
  ImportCharacterJson,
  ImportCommonJson,
  ImportLinksJson,
  ImportBlogPostJson,
} from "~/data/ClientDBFunctions";

import { MdAdd } from "react-icons/md";
import { FilesManager } from "./edit/FilesEdit";
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
  GetAPIFromOptions,
  ImageDataOptions,
  KeyValueDBDataOptions,
  linksDataOptions,
  linksFavDataOptions,
  postsDataOptions,
  redirectDataOptions,
  soundsDataOptions,
} from "~/data/DataEnv";
import { useCharacters } from "~/components/state/CharacterState";
import { FormatDate } from "~/components/functions/DateFunction";
import { KeyValueEditable } from "~/components/state/KeyValueDBState";
import { useImageState } from "~/components/state/ImageState";
import { customFetch } from "~/components/functions/fetch";
import { IdbNavReload } from "~/components/functions/doc/NavReload";
import { useRedirects } from "~/components/state/redirectState";
import { Modal } from "~/components/layout/Modal";
import { useForm } from "react-hook-form";
import { CreateState } from "~/components/state/CreateState";
import { useHotkeys } from "react-hotkeys-hook";

export function AdminPage() {
  const isLogin = useIsLogin()[0];
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
            {isLogin ? (
              <AdminMainPage />
            ) : (
              <>
                <Link to="/login">ログインする</Link>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export function AdminMainPage() {
  return (
    <>
      {/* <a href="/workers">Workersのページ</a> */}
      <Link to="/admin/images">画像管理ページ</Link>
      <Link to="/admin/files">ファイル管理ページ</Link>
      <Link to="/admin/zip">Zipアーカイブ</Link>
      <Link to="/admin/redirect">リダイレクト設定</Link>
      <Link to="/admin/db">データベース設定</Link>
      <Link to="/admin/schedule">スケジュール設定</Link>
      <Link to="/logout">ログアウト</Link>
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
    case "redirect":
      return <RedirectManager />;
    case "db":
      return <DBPage />;
    case "schedule":
      return <ScheduleManager />;
    default:
      return <></>;
  }
}

const useRedirectEdit = CreateState<{ path?: string } | null>(null);
const SEND_REDIRECT_DATA_API = GetAPIFromOptions(redirectDataOptions, "/send");

function RedirectManagerEdit() {
  const [edit, setEdit] = useRedirectEdit();
  const { redirectsMap } = useRedirects();
  const dataItem = useMemo(() => {
    if (redirectsMap && edit?.path) return redirectsMap.get(edit.path) || null;
    return null;
  }, [redirectsMap, edit]);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<any>({
    defaultValues: {
      path: dataItem?.path || "",
      redirect: dataItem?.redirect || "",
    },
  });
  function Submit() {
    const values = getValues();
    const entry = Object.fromEntries(
      Object.entries(dirtyFields)
        .filter((v) => v[1])
        .map((v) => [v[0], values[v[0]]])
    );
    entry.id = dataItem?.id;
    toast.promise(
      customFetch(concatOriginUrl(apiOrigin, SEND_REDIRECT_DATA_API), {
        method: "POST",
        body: entry,
        cors: true,
      }).then(() => {
        redirectDataIndexed.load("no-cache");
        setEdit(null);
      }),
      {
        pending: "送信中",
        success: "送信しました",
        error: "送信に失敗しました",
      }
    );
  }
  function Close() {
    if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
      setEdit(null);
    }
  }
  useHotkeys("escape", Close, { enableOnFormTags: true });
  return (
    <>
      {edit ? (
        <Modal onClose={Close}>
          <form className="flex" onSubmit={handleSubmit(Submit)}>
            <input
              title="リダイレクト元"
              placeholder="リダイレクト元"
              {...register("path")}
            />
            <input
              title="リダイレクト先"
              placeholder="リダイレクト先"
              {...register("redirect")}
            />
            <button
              type="button"
              className="send"
              onClick={handleSubmit(Submit)}
              disabled={!isDirty}
            >
              送信
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
function RedirectManager() {
  const [edit, setEdit] = useRedirectEdit();
  const { redirects } = useRedirects();
  return (
    <>
      {edit ? <RedirectManagerEdit /> : null}
      <main>
        <h2 className="color-main en-title-font">Redirect Manager</h2>
        <ul className="redirects">
          {redirects?.map((item, i) => {
            return (
              <li key={i} tabIndex={-1}>
                <div className="name">{item.path}</div>
                <div>&gt;</div>
                <div className="to">{item.redirect}</div>
                <button
                  type="button"
                  title="編集する"
                  className="color-main miniIcon margin"
                  onClick={(e) => {
                    setEdit(item);
                    e.preventDefault();
                  }}
                >
                  <AiFillEdit />
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              title="追加する"
              className="color-main miniIcon margin"
              onClick={(e) => {
                e.preventDefault();
                setEdit({});
              }}
            >
              <MdAdd />
            </button>
          </li>
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

function DBUpdateFetch() {
  return customFetch(concatOriginUrl(apiOrigin, "data/update"), {
    method: "POST",
    cors: true,
  });
}
function DBUpdate() {
  return toast.promise(DBUpdateFetch, {
    pending: "更新中",
    success: "更新しました！",
    error: "送信に失敗しました",
  });
}

function DBPage() {
  const { charactersMap } = useCharacters();
  const nav = useNavigate();
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
              const newVersions = findMee(IdbStateClassList, {
                where: { key: { not: "tables" } },
              }).filter((v) => v.version !== v.options.version);
              if (newVersions.length === 0) {
                toast("データベースは最新です");
              } else {
                const count = newVersions.length;
                const strList = newVersions.map((v) => v.key).join(", ");
                let updateString = `データベースのテーブルの更新が${count}件(${strList})あります！\n`;
                const needAlterTableList = newVersions.filter((v) => {
                  const m = v.version.match(/\d+.\d+/);
                  const nm = v.options.version.match(/\d+.\d+/);
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
                    return { json, object };
                  });
                  await Promise.all(list).then((list) => {
                    list.map(async ({ object, json }) => {
                      switch (object.key) {
                        case ImageDataOptions.name:
                          await ImportImagesJson({
                            charactersMap,
                            overwrite: true,
                            json,
                          });
                          break;
                        case charactersDataOptions.name:
                          await ImportCharacterJson({
                            json,
                          });
                          break;
                        case postsDataOptions.name:
                          await ImportBlogPostJson({
                            json,
                          });
                          break;
                        case linksDataOptions.name:
                          await ImportLinksJson({
                            json,
                          });
                          break;
                        case linksFavDataOptions.name:
                          await ImportLinksJson({
                            json,
                            dir: "/fav",
                          });
                          break;
                        case KeyValueDBDataOptions.name:
                          await ImportCommonJson({
                            options: KeyValueDBDataOptions,
                            json,
                          });
                          break;
                        case soundsDataOptions.name:
                          await ImportCommonJson({
                            options: soundsDataOptions,
                            json,
                          });
                          break;
                        default:
                          toast(`${object.key}は現在インポートの実装待ちです…`);
                          break;
                      }
                    });
                  });
                  DBUpdate().then(() => {
                    IdbNavReload({ nav });
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
