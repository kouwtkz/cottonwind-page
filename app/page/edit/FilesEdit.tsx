import { PromiseOrder } from "~/components/functions/arrayFunction";
import { customFetch } from "~/components/functions/fetch";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { Modal } from "~/components/layout/Modal";
import { CreateState } from "~/components/state/CreateState";
import {
  apiOrigin,
  filesDataIndexed,
  mediaOrigin,
} from "~/data/ClientDBLoader";
import { UploadToast } from "~/data/ClientDBFunctions";
import { useFiles } from "~/components/state/FileState";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import {
  MdAddComment,
  MdDeleteForever,
  MdFileUpload,
  MdOpenInNew,
  MdOutlineContentCopy,
} from "react-icons/md";
import { toast } from "react-toastify";
import * as z from "zod";
import {
  filesDataOptions,
  filesDefaultDir,
  GetAPIFromOptions,
} from "~/data/DataEnv";
import { fileDialog } from "~/components/utils/FileTool";
import { getExtension } from "~/components/functions/doc/PathParse";
import { RbButtonArea } from "~/components/dropdown/RbButtonArea";
import { AiFillEdit } from "react-icons/ai";
import { FormatDate } from "~/components/functions/DateFunction";
import { Link, useSearchParams } from "react-router";
import { CopyWithToast } from "~/components/functions/toastFunction";
import { RiGitRepositoryPrivateLine } from "react-icons/ri";
import { useDropzone } from "react-dropzone";
import { getMimeType } from "~/components/utils/mime";

const SEND_API = GetAPIFromOptions(filesDataOptions, "/send");

type DirListType = { [s: string]: DirListType };
export function SrclistToDir(list: string[]): DirListType {
  return list.reduce<DirListType>((dir, src) => {
    src
      .split("/")
      .slice(0, -1)
      .reduce((dir, name) => {
        if (name) {
          if (!dir[name]) dir[name] = { "..": dir };
          return dir[name];
        } else return dir;
      }, dir);
    return dir;
  }, {});
}

const useDirParam = CreateState<string>("");

export function FilesManager() {
  const setEdit = useEditFileID()[1];
  const { files: rawFiles } = useFiles();
  const dir = useMemo(() => {
    const list = rawFiles?.filter((file) => file.src).map((file) => file.src!);
    if (list) return SrclistToDir(list);
    return null;
  }, [rawFiles]);
  const [searchParams, setSearchParams] = useSearchParams();
  const dirParam = useMemo(
    () => (searchParams.get("dir") || filesDefaultDir).replace(/^\/+/, ""),
    [searchParams]
  );
  const setDirParam = useDirParam()[1];
  useEffect(() => {
    setDirParam(dirParam);
  }, [dirParam]);
  const viewAll = useMemo(() => searchParams.has("all"), [searchParams]);
  const currentDir = useMemo(() => {
    return dirParam.split("/").reduce((dir, c) => {
      if (!c) return dir;
      else if (dir) return dir[c] || null;
      return dir;
    }, dir);
  }, [dirParam, dir]);
  const dirList = useMemo(() => {
    if (!viewAll) {
      if (currentDir) return Object.entries(currentDir);
      else return [[".."]];
    } else return [];
  }, [currentDir, viewAll]);
  const files = useMemo(() => {
    if (!rawFiles) return [];
    else if (viewAll) return rawFiles.concat();
    else if (dirParam)
      return rawFiles.filter((file) => {
        return file.dir === dirParam;
      });
    else return rawFiles.filter((file) => !file.dir);
  }, [rawFiles, dirParam]);
  const dirBreadcrumbList = useMemo(() => {
    return (dirParam ? "/" + dirParam : "")
      .split("/")
      .reduce<{ path: string; name: string }[]>((a, c, i) => {
        if (!c) a.push({ path: "/", name: "Root" });
        else {
          const j = a.length - 1;
          const path = j >= 0 && a[j].path !== "/" ? a[j].path + "/" + c : c;
          a.push({ path, name: c });
        }
        return a;
      }, []);
  }, [dirParam]);
  const privateRef = useRef<HTMLInputElement>(null);
  const onUpload = useCallback(
    async (files: File[]) => {
      let isPrivate: boolean | undefined;
      if (privateRef.current?.checked) isPrivate = true;
      FilesUpload({ files, dir: dirParam, private: isPrivate }).then(() => {
        filesDataIndexed.load("no-cache");
      });
    },
    [dirParam]
  );
  const onUploadSelect = useCallback(async () => {
    fileDialog("*", true)
      .then((files) => Array.from(files))
      .then((files) => {
        onUpload(files);
      });
  }, [dirParam]);
  const onNewTextfile = useCallback(async () => {
    setEdit(-1);
  }, []);
  const defaultPrivate = useMemo(() => {
    const latest = files.reduce<FilesRecordType | null>((a, c) => {
      if (a && (a.lastmod?.getTime() || 0) > (c.lastmod?.getTime() || 0))
        return a;
      else return c;
    }, null);
    return latest?.private || false;
  }, [files]);
  useEffect(() => {
    if (privateRef.current && !privateRef.current.dataset.touched) {
      privateRef.current.checked = defaultPrivate;
    }
  }, [defaultPrivate]);
  const { getRootProps, rootRef } = useDropzone({
    onDragEnter(e) {
      rootRef.current.classList.add("drag");
    },
    onDragLeave(e) {
      rootRef.current.classList.remove("drag");
    },
    onDropRejected(fileRejections, event) {
      rootRef.current.classList.remove("drag");
    },
    onDropAccepted(files, event) {
      rootRef.current.classList.remove("drag");
      onUpload(files);
    },
    noClick: true,
  });
  return (
    <>
      <FilesEdit />
      <RbButtonArea>
        <button
          type="button"
          className="color round font-larger"
          title="新規テキストファイル"
          onClick={onNewTextfile}
        >
          <MdAddComment />
        </button>
        <button
          type="button"
          className="color round font-larger"
          title="ファイルのアップロード"
          onClick={onUploadSelect}
        >
          <MdFileUpload />
        </button>
      </RbButtonArea>
      <main className="fileManagePage">
        <div {...getRootProps()}>
          <h2 className="color-main en-title-font">File Manager</h2>
          <div className="managerHeader">
            {viewAll ? null : (
              <>
                {dirBreadcrumbList.reduce<ReactNode[]>((a, c, i) => {
                  if (dirBreadcrumbList.length > i + 1) {
                    const newSearchParams = new URLSearchParams();
                    if (c.path !== filesDefaultDir)
                      newSearchParams.set("dir", c.path);
                    a.push(
                      <Link key={i} to={{ search: newSearchParams.toString() }}>
                        {c.name}
                      </Link>
                    );
                  } else {
                    a.push(<span key={i}>{c.name}</span>);
                  }
                  a.push(<span key={i + "-slash"}>/</span>);
                  return a;
                }, [])}
                <form
                  autoComplete="off"
                  onSubmit={(e) => {
                    const form = e.target as HTMLFormElement;
                    const value = form.path.value;
                    if (value) {
                      const newDir = dirParam
                        ? dirParam + "/" + form.path.value
                        : form.path.value;
                      setSearchParams({ dir: newDir });
                      form.path.value = "";
                    }
                    e.preventDefault();
                  }}
                >
                  <input title="Child directory" name="path" type="text" />
                </form>
              </>
            )}
            <button
              type="button"
              className="color-main miniIcon"
              title="ファイルのアップロード"
              onClick={onUploadSelect}
            >
              {viewAll ? <span>upload</span> : null}
              <MdFileUpload />
            </button>
            <label className="private link">
              <input
                name="private"
                type="checkbox"
                title="非公開"
                defaultChecked={defaultPrivate}
                ref={privateRef}
                onChange={(e) => {
                  const checkbox = e.target as HTMLInputElement;
                  checkbox.dataset.touched = "1";
                }}
              />
              <RiGitRepositoryPrivateLine />
            </label>
          </div>
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>更新日</th>
                <th>ボタン</th>
              </tr>
            </thead>
            <tbody>
              {dirList.map((dir, i) => {
                const newSearchParams = new URLSearchParams();
                let link =
                  dir[0] === ".."
                    ? dirParam.replace(/\/?[^\/]+$/, "")
                    : (dirParam ? `${dirParam}/` : "") + dir[0];
                if (link !== filesDefaultDir) {
                  if (link) newSearchParams.set("dir", link);
                  else newSearchParams.set("dir", "/");
                }
                return (
                  <tr key={i} tabIndex={-1}>
                    <td className="name">
                      <Link
                        to={{ search: newSearchParams.toString() }}
                        title={link || "Root"}
                      >
                        {dir[0] === ".." ? "<< back" : dir[0]}
                      </Link>
                    </td>
                    <td />
                    <td />
                  </tr>
                );
              })}
              {files?.map((file, i) => {
                const dateStr = file.mtime
                  ? FormatDate(file.mtime, "Y-m-d H:i:s")
                  : "";
                const dateShortStr = dateStr?.split(" ", 1)[0];
                const Url = new URL(
                  concatOriginUrl(mediaOrigin, file.src),
                  location.href
                );
                const url = Url.toString();
                return (
                  <tr key={i} tabIndex={-1}>
                    <td className="name">{file.key}</td>
                    <td title={dateStr}>{dateShortStr}</td>
                    <td className="buttons">
                      <div className="buttons">
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
                        <button
                          title="ファイルパスのコピー"
                          type="button"
                          className="color-main miniIcon margin"
                          onClick={() => {
                            CopyWithToast(url);
                          }}
                        >
                          <MdOutlineContentCopy />
                        </button>
                        <a
                          className="button color-main miniIcon margin"
                          title="ファイルを開く"
                          target="file"
                          href={url}
                        >
                          <MdOpenInNew />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

export async function FilesUploadProcess({
  files,
  dir,
  private: isPrivate,
  key,
  send = SEND_API,
  sleepTime = 10,
  minTime,
}: FilesUploadProps) {
  const keys = key ? (Array.isArray(key) ? key : [key]) : [];
  const url = concatOriginUrl(apiOrigin, send);
  const formDataList = files.map((file, i) => {
    const formData = new FormData();
    formData.append("file", file);
    if (typeof dir === "string") formData.append("dir", dir);
    if (isPrivate) formData.append("private", "1");
    if (i in keys) formData.append("key", keys[i]);
    return formData;
  });
  const fetchList = formDataList.map(
    (body) => () => customFetch(url, { method: "POST", body, cors: true })
  );
  const results = await PromiseOrder(fetchList, { sleepTime, minTime });
  const successCount = results.filter((r) => r.status === 200).length;
  if (results.length === successCount) {
    return {
      message: successCount + "件のアップロードに成功しました！",
      results,
    };
  } else {
    console.error("以下のアップロードに失敗しました");
    const failedList = results
      .filter((r) => r.status !== 200)
      .map((_, i) => formDataList[i])
      .map((formData) => {
        const file = formData.get("file") as File;
        const name = file.name;
        console.error(name);
        return name;
      });
    throw {
      message:
        (successCount
          ? successCount + "件のアップロードに成功しましたが、"
          : "") +
        failedList.length +
        "件のアップロードに失敗しました\n" +
        failedList.join("\n"),
      results,
    };
  }
}

export async function FilesUpload(args: FilesUploadProps) {
  return UploadToast(FilesUploadProcess(args));
}

export const useEditFileID = CreateState<number>();

const schema = z.object({
  key: z.string().min(1, { message: "ファイルIDを入力してください" }),
  src: z.string().min(1, { message: "ファイルパスを入力してください" }),
});

export function FilesEdit({ send = SEND_API }: { send?: string }) {
  const [edit, setEdit] = useEditFileID();
  const dirParam = useDirParam()[0];
  const { files } = useFiles();
  const fileIndex = useMemo(
    () => files?.findIndex((v) => v.id === edit),
    [files, edit]
  );
  const fileItem = useMemo(
    () => (files && typeof fileIndex === "number" ? files[fileIndex] : null),
    [files, fileIndex]
  );
  const item = useMemo(() => files?.find((v) => v.id === edit), [files, edit]);
  const ext = useMemo(() => (item?.src ? getExtension(item.src) : ""), [item]);
  const isTextFile = useMemo(() => {
    if (edit === -1) return true;
    else {
      const mime = getMimeType(ext);
      return Boolean(mime && /(^text|json|xml)/.test(mime));
    }
  }, [ext, edit]);
  const targetLastmod = useRef<string | null>(null);
  useEffect(() => {
    if (targetLastmod.current) {
      setEdit(
        files?.find((v) => v.rawdata?.lastmod === targetLastmod.current)?.id
      );
      targetLastmod.current = null;
    }
  }, [files]);
  const getDefaultValuesFromFile = useCallback(
    () => ({
      key: fileItem?.key || "",
      src: fileItem?.src || dirParam + "/",
      private: fileItem?.private || false,
      text: "",
    }),
    [fileItem, dirParam]
  );
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields, errors },
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
  });
  useEffect(() => {
    reset(getDefaultValuesFromFile());
    if (isTextFile && fileItem?.src) {
      fetch(concatOriginUrl(mediaOrigin, fileItem.src))
        .then((r) => r.text())
        .then((text) => {
          reset({ text }, { keepDirty: true });
        });
    }
  }, [fileItem, isTextFile, reset]);

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      toast.error(String(error?.message));
    });
  }, [errors]);
  function Submit() {
    const values = getValues();
    const formData = new FormData();
    formData.append("update", "");
    const allMode = edit === -1;
    (allMode
      ? Object.entries(getValues())
      : Object.entries(dirtyFields)
          .filter((v) => v[1])
          .map((v) => [v[0], values[v[0]]])
    ).forEach(([key, value]) => {
      switch (typeof value) {
        case "string":
          formData.append(key, value);
          break;
        case "boolean":
          formData.append(key, value ? "1" : "0");
          break;
        default:
          formData.append(key, String(value));
          break;
      }
    });
    if (typeof fileItem?.id !== "undefined")
      formData.append("id", fileItem.id.toString());
    toast.promise(
      customFetch(concatOriginUrl(apiOrigin, send), {
        method: "POST",
        body: formData,
        cors: true,
      }).then(() => {
        filesDataIndexed.load("no-cache");
        setEdit();
      }),
      {
        pending: "送信中",
        success: "送信しました",
        error: "送信に失敗しました",
      }
    );
  }
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) handleSubmit(Submit)();
    },
    { enableOnFormTags: true }
  );
  function Close() {
    if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
      setEdit();
    }
  }
  useHotkeys("escape", Close, { enableOnFormTags: true });
  return (
    <Modal className="filesEdit" onClose={Close} isOpen={Boolean(edit)}>
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <div className="header">
          <button
            title="削除"
            type="button"
            className="color-warm miniIcon margin"
            onClick={async () => {
              const id = item?.id;
              if (id && confirm("本当に削除しますか？")) {
                customFetch(concatOriginUrl(apiOrigin, send), {
                  method: "DELETE",
                  body: { id },
                  cors: true,
                }).then(() => {
                  filesDataIndexed.load("no-cache");
                  setEdit();
                });
              }
            }}
          >
            <MdDeleteForever />
          </button>
          <button
            type="button"
            className="send"
            onClick={() => {
              fileDialog(`.${ext}`, true)
                .then((files) => Array.from(files))
                .then((files) => FilesUpload({ files, key: item?.key }))
                .then(() => {
                  filesDataIndexed.load("no-cache");
                });
            }}
          >
            差し替える
          </button>
          <label className="private link">
            <input type="checkbox" title="非公開" {...register("private")} />
            <RiGitRepositoryPrivateLine />
          </label>
        </div>
        <input
          title="ファイルID"
          placeholder="ファイルのID"
          {...register("key")}
        />
        <input
          title="ファイルパス"
          placeholder="ファイルパス"
          {...register("src")}
        />
        <textarea
          title="ファイルの内容"
          hidden={!isTextFile}
          {...register("text")}
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
  );
}
