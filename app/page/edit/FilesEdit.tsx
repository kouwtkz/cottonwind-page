import { PromiseOrder } from "~/components/functions/arrayFunction";
import { customFetch } from "~/components/functions/fetch";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { Modal } from "~/components/layout/Modal";
import { CreateState } from "~/components/state/CreateState";
import { apiOrigin, filesDataIndexed } from "~/data/ClientDBLoader";
import { UploadToast } from "~/data/ClientDBFunctions";
import { useFiles } from "~/components/state/FileState";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { MdDeleteForever } from "react-icons/md";
import { toast } from "react-toastify";
import * as z from "zod";
import { filesDataOptions, GetAPIFromOptions } from "~/data/DataEnv";

const SEND_API = GetAPIFromOptions(filesDataOptions, "/send");

export async function FilesUploadProcess({
  files,
  send = SEND_API,
  sleepTime = 10,
  minTime,
}: FilesUploadProps) {
  const url = concatOriginUrl(apiOrigin, send);
  const formDataList = files.map((file) => {
    const formData = new FormData();
    formData.append("file", file);
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

export function FilesEdit({
  send = SEND_API,
  edit,
  setEdit,
}: {
  send?: string;
  edit?: number;
  setEdit(v?: number): void;
}) {
  const { files } = useFiles();
  const dataItem = useMemo(
    () => files?.find((v) => v.id === edit),
    [files, edit]
  );
  const item = useMemo(() => files?.find((v) => v.id === edit), [files, edit]);
  const targetLastmod = useRef<string | null>(null);
  useEffect(() => {
    if (targetLastmod.current) {
      setEdit(
        files?.find((v) => v.rawdata?.lastmod === targetLastmod.current)?.id
      );
      targetLastmod.current = null;
    }
  }, [files]);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields, errors },
  } = useForm<any>({
    defaultValues: {
      key: dataItem?.key,
      src: dataItem?.src,
    },
    resolver: zodResolver(schema),
  });
  useEffect(() => {
    Object.values(errors).forEach((error) => {
      toast.error(String(error?.message));
    });
  }, [errors]);
  function Submit() {
    const values = getValues();
    const entry = Object.fromEntries(
      Object.entries(dirtyFields)
        .filter((v) => v[1])
        .map((v) => [v[0], values[v[0]]])
    ) as SiteLink;
    entry.id = dataItem?.id;
    toast.promise(
      customFetch(concatOriginUrl(apiOrigin, send), {
        method: "PATCH",
        body: entry,
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
    <Modal onClose={Close}>
      <div className="text-left">
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
      </div>
      <form className="flex" onSubmit={handleSubmit(Submit)}>
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
