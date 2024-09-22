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
import { FilesUploadProcess } from "./FilesEdit";

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
            className="color round large"
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
            className="color round large"
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
        className="button color round large"
        title={"サウンド編集モードの切り替え"}
      >
        {isEdit ? <MdArrowBackIosNew /> : <MdEditNote />}
      </Link>
      <button
        type="button"
        className="color round large"
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

export async function SoundsUploadProcess(args: UploadBaseProps) {
  return FilesUploadProcess({ ...args, path: "/sound/send" });
}

export async function SoundsUpload(args: UploadBaseProps) {
  return UploadToast(SoundsUploadProcess(args));
}
