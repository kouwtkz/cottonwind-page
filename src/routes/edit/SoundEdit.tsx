import { fileDialog } from "@/components/FileTool";
import {
  ImportCommonJson,
  soundAlbumsDataIndexed,
  soundsDataIndexed,
  UploadToast,
} from "@/data/DataState";
import { useApiOrigin } from "@/state/EnvState";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilesUploadProcess } from "./FilesEdit";
import { Modal } from "@/layout/Modal";
import { CreateState } from "@/state/CreateState";
import { FieldValues, useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-toastify";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
import {
  ImportObjectButtonProps,
  ObjectCommonButton,
  ObjectIndexedDBDownloadButton,
} from "@/components/button/ObjectDownloadButton";
import { DropdownButton } from "@/components/dropdown/DropdownButton";
import { RiArrowGoBackFill, RiEditFill, RiUploadFill } from "react-icons/ri";
import { TbDatabaseImport } from "react-icons/tb";
import { useSounds } from "@/state/SoundState";
import { soundsDataOptions } from "@/data/DataEnv";

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
  return (
    <div className="icons flex center">
      <DropdownButton
        classNames={{
          dropMenuButton: "iconSwitch",
          dropItemList: "flex column font-small",
        }}
        keepOpen
      >
        <ObjectIndexedDBDownloadButton
          className="squared item"
          indexedDB={soundsDataIndexed}
        >
          サウンドJSONデータのダウンロード
        </ObjectIndexedDBDownloadButton>
        <SoundsImportButton
          className="squared item"
          icon={<TbDatabaseImport />}
        >
          サウンドJSONデータのインポート
        </SoundsImportButton>
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
              soundsDataIndexed.load("no-cache");
            });
        }}
      >
        <RiUploadFill />
      </button>
    </div>
  );
}

export function SoundsImportButton({
  overwrite = true,
  ...props
}: ImportObjectButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  return (
    <ObjectCommonButton
      {...props}
      onClick={() => {
        ImportCommonJson({ options: soundsDataOptions, apiOrigin }).then(() => {
          soundsDataIndexed.load("no-cache-reload");
        });
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
  const { soundsMap } = useSounds();
  const dataItem = useMemo(() => {
    if (edit) return soundsMap.get(edit);
  }, [soundsMap, edit]);
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
            soundAlbumsDataIndexed.load("no-cache");
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
  const { soundAlbumsMap } = useSounds();
  const item = useMemo(() => {
    if (edit) return soundAlbumsMap.get(edit);
  }, [soundAlbumsMap, edit]);
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
            soundAlbumsDataIndexed.load("no-cache");
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
