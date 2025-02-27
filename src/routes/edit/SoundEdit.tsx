import { fileDialog } from "@/components/FileTool";
import {
  soundAlbumsDataObject,
  soundsDataObject,
  UploadToast,
} from "@/state/DataState";
import { useApiOrigin } from "@/state/EnvState";
import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilesUploadProcess } from "./FilesEdit";
import { Modal } from "@/layout/Modal";
import { CreateState } from "@/state/CreateState";
import { useSoundAlbumsMap, useSoundsMap } from "@/state/SoundState";
import { FieldValues, useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-toastify";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
import {
  ImportObjectButtonProps,
  ObjectCommonButton,
  ObjectDownloadButton,
} from "@/components/button/ObjectDownloadButton";
import { DropdownButton } from "@/components/dropdown/DropdownButton";
import { RiArrowGoBackFill, RiEditFill, RiUploadFill } from "react-icons/ri";
import { TbDatabaseImport } from "react-icons/tb";

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
    <div className="icons flex center">
      <DropdownButton
        classNames={{
          dropMenuButton: "iconSwitch",
          dropItemList: "flex column font-small",
        }}
        keepOpen
      >
        <ObjectDownloadButton
          className="squared item"
          dataObject={soundsDataObject}
        >
          サウンドJSONデータのダウンロード
        </ObjectDownloadButton>
        {/* <GalleryImportButton
          className="squared item"
          icon={<TbDatabaseImport />}
        >
          サウンドJSONデータのインポート
        </GalleryImportButton> */}
      </DropdownButton>
      <Link
        to={switchEditModeLink}
        className="iconSwitch"
        title={"サウンド編集モードの切り替え"}
      >
        {isEdit ? <RiArrowGoBackFill /> : <RiEditFill />}
      </Link>
      <button
        type="button"
        className="iconSwitch"
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
        <RiUploadFill />
      </button>
    </div>
  );
}

export function GalleryImportButton({
  overwrite = true,
  ...props
}: ImportObjectButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const setSoundsLoad = soundsDataObject.useLoad()[1];
  return (
    <ObjectCommonButton
      {...props}
      onClick={() => {
        // ImportSoundJson({ apiOrigin }).then(() => {
        //   setSoundsLoad("no-cache-reload");
        // });
      }}
    />
  );
}

export async function SoundsUploadProcess(args: UploadBaseProps) {
  return FilesUploadProcess({ ...args, send: "/sound/send" });
}

export async function SoundsUpload(args: UploadBaseProps) {
  return UploadToast(SoundsUploadProcess(args));
}

export const useEditSoundKey = CreateState<string | null>(null);
export function SoundEdit() {
  const [edit, setEdit] = useEditSoundKey();
  const soundsMap = useSoundsMap()[0];
  const soundsData = soundsDataObject.useData()[0];
  const setLoad = soundsDataObject.useLoad()[1];
  const dataItem = useMemo(
    () => soundsData?.find((v) => v.key === edit),
    [soundsData, edit]
  );
  const item = useMemo(
    () => (edit ? soundsMap?.get(edit) : false) || null,
    [soundsMap, edit]
  );
  const targetLastmod = useRef<string | null>(null);
  useEffect(() => {
    if (targetLastmod.current) {
      const found = soundsData?.find(
        (v) => v.lastmod === targetLastmod.current
      );
      if (found) setEdit(found.key);
      targetLastmod.current = null;
    }
  }, [soundsData]);
  const apiOrigin = useApiOrigin()[0];
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields },
  } = useForm<FieldValues>({
    defaultValues: {
      title: dataItem?.title,
    },
  });
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) Submit();
    },
    { enableOnFormTags: true }
  );
  function Submit() {
    if (dataItem) {
      const values = getValues();
      const entry = Object.fromEntries(
        Object.entries(dirtyFields)
          .filter((v) => v[1])
          .map((v) => [v[0], values[v[0]]])
      );
      entry.target = dataItem.key;
      toast.promise(
        axios
          .patch(concatOriginUrl(apiOrigin, "sound/send"), entry, {
            withCredentials: true,
          })
          .then(() => {
            setLoad("no-cache");
            setEdit(null);
          }),
        {
          pending: "送信中",
          success: "送信しました",
          error: "送信に失敗しました",
        }
      );
    }
  }
  return (
    <Modal
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setEdit(null);
        }
      }}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <input
          title="タイトル"
          placeholder="曲のタイトル"
          {...register("title")}
        />
        <button
          type="button"
          className="color"
          onClick={handleSubmit(Submit)}
          disabled={!isDirty}
        >
          送信
        </button>
      </form>
    </Modal>
  );
}

export const useEditSoundAlbumKey = CreateState<string | null>(null);
export function SoundAlbumEdit() {
  const [edit, setEdit] = useEditSoundAlbumKey();
  const soundAlbumsMap = useSoundAlbumsMap()[0];
  const soundAlbumsData = soundAlbumsDataObject.useData()[0];
  const setLoad = soundAlbumsDataObject.useLoad()[1];
  const dataItem = useMemo(
    () => soundAlbumsData?.find((v) => v.key === edit),
    [soundAlbumsData, edit]
  );
  const item = useMemo(
    () => (edit ? soundAlbumsMap?.get(edit) : false) || null,
    [soundAlbumsMap, edit]
  );
  const targetLastmod = useRef<string | null>(null);
  useEffect(() => {
    if (targetLastmod.current) {
      const found = soundAlbumsData?.find(
        (v) => v.lastmod === targetLastmod.current
      );
      if (found) setEdit(found.key);
      targetLastmod.current = null;
    }
  }, [soundAlbumsData]);
  const apiOrigin = useApiOrigin()[0];
  const {
    register,
    handleSubmit,
    getValues,
    formState: { isDirty, dirtyFields },
  } = useForm<FieldValues>({
    defaultValues: {
      title: item?.title || item?.key,
    },
  });
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (isDirty) Submit();
    },
    { enableOnFormTags: true }
  );
  function Submit() {
    if (item) {
      const values = getValues();
      const entry = Object.fromEntries(
        Object.entries(dirtyFields)
          .filter((v) => v[1])
          .map((v) => [v[0], values[v[0]]])
      );
      entry.target = item.key;
      toast.promise(
        axios
          .patch(concatOriginUrl(apiOrigin, "sound/album/send"), entry, {
            withCredentials: true,
          })
          .then(() => {
            setLoad("no-cache");
            setEdit(null);
          }),
        {
          pending: "送信中",
          success: "送信しました",
          error: "送信に失敗しました",
        }
      );
    }
  }
  return (
    <Modal
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setEdit(null);
        }
      }}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <input
          title="タイトル"
          placeholder="アルバムのタイトル"
          {...register("title")}
        />
        <button
          type="button"
          className="color"
          onClick={handleSubmit(Submit)}
          disabled={!isDirty}
        >
          送信
        </button>
      </form>
    </Modal>
  );
}
