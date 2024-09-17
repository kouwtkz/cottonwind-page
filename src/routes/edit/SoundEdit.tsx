import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog, fileDownload } from "@/components/FileTool";
import { LinkMee } from "@/functions/doc/MakeURL";
import { soundsDataObject, UploadToast } from "@/state/DataState";
import { useApiOrigin } from "@/state/EnvState";
import { useMemo } from "react";
import {
  MdArrowBackIosNew,
  MdEditNote,
  MdFileDownload,
  MdFileUpload,
} from "react-icons/md";
import { TbDatabaseImport } from "react-icons/tb";
import { Link, useSearchParams } from "react-router-dom";
import { srcObjectType } from "./ImageEditForm";
import { corsFetch } from "@/functions/fetch";
import { PromiseOrder } from "@/functions/arrayFunction";

export function SoundEditButton() {
  const apiOrigin = useApiOrigin()[0];
  const searchParams = useSearchParams()[0];
  const isEdit = searchParams.get("edit") === "on";
  const switchEditModeLink = useMemo(() => {
    const Url = new URL(location.href);
    if (isEdit) Url.searchParams.delete("edit");
    else Url.searchParams.set("edit", "on");
    return Url.href;
  }, [isEdit]);
  const setSoundsLoad = soundsDataObject.useLoad()[1];
  return (
    <RbButtonArea
      dropdown={
        <>
          <button
            type="button"
            className="round large"
            title="サウンドデータのダウンロード"
            onClick={async () => {
              fileDownload(
                soundsDataObject.storage.key + ".json",
                JSON.stringify(soundsDataObject.storage)
              );
            }}
          >
            <MdFileDownload />
          </button>
          {/* <button
            type="button"
            className="round large"
            title="サウンドデータベースのインポート"
            onClick={() => {
              ImportSoundJson({ apiOrigin }).then(() => {
                setSoundsLoad("no-cache-reload");
              });
            }}
          >
            <TbDatabaseImport />
          </button> */}
        </>
      }
    >
      <Link
        to={switchEditModeLink}
        className="button round large"
        title={"サウンド編集モードの切り替え"}
      >
        {isEdit ? <MdArrowBackIosNew /> : <MdEditNote />}
      </Link>
      <button
        type="button"
        className="round large"
        title="音楽のアップロード"
        onClick={async () => {
          fileDialog("audio/*", true)
            .then((files) => Array.from(files))
            .then((files) =>
              SoundsUpload({
                files,
                apiOrigin,
              })
            )
            .then(() => {
              setSoundsLoad("no-cache");
            });
        }}
      >
        <MdFileUpload />
      </button>
    </RbButtonArea>
  );
}

interface SoundsUploadProps {
  files: File[];
  apiOrigin?: string;
}
export async function SoundsUploadProcess({
  files,
  apiOrigin,
}: SoundsUploadProps) {
  const url = (apiOrigin || "") + "/sound/send";
  const formDataList = files.map((file) => {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  });
  const fetchList = formDataList.map(
    (body) => () => corsFetch(url, { method: "POST", body })
  );
  const results = await PromiseOrder(fetchList, 10);
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
        const file = (formData.get("file")) as File;
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

export async function SoundsUpload(args: SoundsUploadProps) {
  return UploadToast(SoundsUploadProcess(args));
}
