import { fileDialog } from "~/components/utils/FileTool";
import {
  apiOrigin,
  soundAlbumsDataIndexed,
  soundsDataIndexed,
} from "~/data/ClientDBLoader";
import { ImportCommonJson, UploadToast } from "~/data/ClientDBFunctions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { FilesUploadProcess } from "./FilesEdit";
import { Modal } from "~/components/layout/Modal";
import { CreateState } from "~/components/state/CreateState";
import { type FieldValues, useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "react-toastify";
import { concatOriginUrl } from "~/components/functions/originUrl";
import {
  type ImportObjectButtonProps,
  ObjectCommonButton,
  ObjectIndexedDBDownloadButton,
} from "~/components/button/ObjectDownloadButton";
import { DropdownButton } from "~/components/dropdown/DropdownButton";
import { RiArrowGoBackFill, RiEditFill, RiUploadFill } from "react-icons/ri";
import { TbDatabaseImport } from "react-icons/tb";
import { useSounds } from "~/components/state/SoundState";
import {
  GetAPIFromOptions,
  soundAlbumsDataOptions,
  soundsDataOptions,
} from "~/data/DataEnv";
import { customFetch } from "~/components/functions/fetch";
import { ToFormTime } from "~/components/functions/DateFunction";
import { SendDelete } from "~/components/functions/sendFunction";

const SOUND_SEND_API = GetAPIFromOptions(soundsDataOptions, "/send");
const ALBUM_SEND_API = GetAPIFromOptions(soundAlbumsDataOptions, "/send");

export function SoundEditButton() {
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
        <ObjectIndexedDBDownloadButton
          className="squared item"
          indexedDB={soundAlbumsDataIndexed}
        >
          サウンドアルバムJSONデータのダウンロード
        </ObjectIndexedDBDownloadButton>
        <SoundsImportButton
          className="squared item"
          icon={<TbDatabaseImport />}
          album
        >
          サウンドアルバムJSONデータのインポート
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
              })
            )
            .then(() => {
              soundsDataIndexed.load("no-cache");
              soundAlbumsDataIndexed.load("no-cache");
            });
        }}
      >
        <RiUploadFill />
      </button>
    </div>
  );
}

interface ImportSoundsObjectButtonProps extends ImportObjectButtonProps {
  album?: boolean;
}
export function SoundsImportButton({
  overwrite = true,
  album,
  ...props
}: ImportSoundsObjectButtonProps) {
  return (
    <ObjectCommonButton
      {...props}
      onClick={() => {
        if (album) {
          ImportCommonJson({ options: soundAlbumsDataOptions }).then(() => {
            soundAlbumsDataIndexed.load("no-cache-reload");
          });
        } else {
          ImportCommonJson({ options: soundsDataOptions }).then(() => {
            soundsDataIndexed.load("no-cache-reload");
          });
        }
      }}
    />
  );
}

export async function SoundsUploadProcess(args: UploadBaseProps) {
  return FilesUploadProcess({
    ...args,
    send: SOUND_SEND_API,
  });
}

export async function SoundsUpload(args: UploadBaseProps) {
  return UploadToast(SoundsUploadProcess(args));
}

export const useEditSoundKey = CreateState<string | null>(null);
export function SoundEdit() {
  const [edit, setEdit] = useEditSoundKey();
  const { soundsMap } = useSounds();
  const item = useMemo(() => {
    if (edit) return soundsMap.get(edit);
  }, [soundsMap, edit]);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<any>({
    defaultValues: {
      title: item?.title || item?.key || "",
      album: item?.album || "",
      artist: item?.artist || "",
      composer: item?.composer || "",
      track: item?.track?.toString() || "",
      genre: item?.genre || "",
      grouping: item?.grouping || "",
      cover: item?.cover || "",
      key: item?.key || "",
      description: item?.description || "",
      time: item?.time ? ToFormTime(new Date(item.time)) : null,
      draft: item?.draft ?? null,
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
        customFetch(concatOriginUrl(apiOrigin, SOUND_SEND_API), {
          method: "PATCH",
          body: entry,
          cors: true,
        }).then(() => {
          soundsDataIndexed.load("no-cache");
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
  const Reset = useCallback(() => {
    reset();
  }, []);
  const Delete = useCallback(() => {
    if (edit && item && confirm("本当に削除しますか？")) {
      SendDelete({
        url: concatOriginUrl(apiOrigin, SOUND_SEND_API),
        data: { target: item.key },
      }).then((r) => {
        if (r.ok) {
          soundsDataIndexed.load("no-cache");
          soundAlbumsDataIndexed.load("no-cache");
          setEdit(null);
        }
      });
    }
  }, [edit, item]);

  return (
    <Modal
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setEdit(null);
        }
      }}
      timeout={60}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <label>
          <span className="label">タイトル</span>
          <input
            title="タイトル"
            placeholder="曲のタイトル"
            {...register("title")}
          />
        </label>
        <label>
          <span className="label">アーティスト</span>
          <input
            title="アーティスト"
            placeholder="曲の作曲・編曲者や歌手など"
            {...register("artist")}
          />
        </label>
        <label>
          <span className="label">作曲者</span>
          <input
            title="作曲者"
            placeholder="曲の作曲者"
            {...register("composer")}
          />
        </label>
        <label>
          <span className="label">トラックNo</span>
          <input type="number" title="トラック番号" {...register("track")} />
        </label>
        <label>
          <span className="label">制作日</span>
          <input
            type="datetime-local"
            step={60}
            title="制作日"
            {...register("time")}
          />
        </label>
        <label>
          <span className="label">ジャンル</span>
          <input
            title="グループ"
            placeholder="分類など"
            {...register("genre")}
          />
        </label>
        <label>
          <span className="label">グループ</span>
          <input
            title="グループ"
            placeholder="分類など"
            {...register("grouping")}
          />
        </label>
        <label>
          <span className="label">アルバム</span>
          <input
            title="アルバム"
            placeholder="アルバムのキー名"
            {...register("album")}
          />
        </label>
        {/* <label>
          <span className="label">曲の主キー</span>
          <input
            title="曲のID（タイトル名）"
            placeholder="曲のID（キー、タイトル名など）"
            {...register("key")}
          />
        </label> */}
        <textarea
          title="詳細"
          placeholder="詳細"
          {...register("description")}
        />
        <label>
          <span className="label">下書き</span>
          <input title="下書き" type="checkbox" {...register("draft")} />
        </label>
        <div className="actions">
          <button type="button" className="color-warm" onClick={Delete}>
            削除
          </button>
          <button
            type="button"
            className="color"
            onClick={Reset}
            disabled={!isDirty}
          >
            リセット
          </button>
          <button
            type="submit"
            className="color"
            onClick={handleSubmit(Submit, (e) => {
              console.log(e);
            })}
            disabled={!isDirty}
          >
            送信
          </button>
        </div>
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
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<any>({
    defaultValues: {
      title: item?.title || item?.key || "",
      artist: item?.artist || "",
      draft: item?.draft || null,
      category: item?.category || "",
      order: item?.order || "",
      description: item?.description || "",
      cover: item?.cover || "",
      time: item?.time ? ToFormTime(new Date(item.time)) : null,
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
        customFetch(concatOriginUrl(apiOrigin, ALBUM_SEND_API), {
          method: "PATCH",
          body: entry,
          cors: true,
        }).then(() => {
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
  const Reset = useCallback(() => {
    reset();
  }, []);
  const Delete = useCallback(() => {
    if (edit && item && confirm("本当に削除しますか？")) {
      SendDelete({
        url: concatOriginUrl(apiOrigin, SOUND_SEND_API),
        data: { target: item.key },
      }).then((r) => {
        if (r.ok) {
          soundsDataIndexed.load("no-cache");
          soundAlbumsDataIndexed.load("no-cache");
          setEdit(null);
        }
      });
    }
  }, [edit, item]);
  return (
    <Modal
      onClose={() => {
        if (!isDirty || confirm("編集中ですが編集画面から離脱しますか？")) {
          setEdit(null);
        }
      }}
      timeout={60}
    >
      <form className="flex" onSubmit={handleSubmit(Submit)}>
        <label>
          <span className="label">タイトル</span>
          <input
            title="タイトル"
            placeholder="曲のタイトル"
            {...register("title")}
          />
        </label>
        <label>
          <span className="label">アーティスト</span>
          <input
            title="アルバムアーティスト"
            placeholder="アルバムの総合的なアーティスト"
            {...register("artist")}
          />
        </label>
        <label>
          <span className="label">制作日</span>
          <input
            type="datetime-local"
            step={60}
            title="制作日"
            {...register("time")}
          />
        </label>
        <label>
          <span className="label">ディスクNo</span>
          <input type="number" title="ディスク番号" {...register("order")} />
        </label>
        <label>
          <span className="label">カテゴリ</span>
          <input
            title="カテゴリ"
            placeholder="分類など"
            {...register("category")}
          />
        </label>
        <div className="actions">
          <button type="button" className="color-warm" onClick={Delete}>
            削除
          </button>
          <button
            type="button"
            className="color"
            onClick={Reset}
            disabled={!isDirty}
          >
            リセット
          </button>
          <button
            type="submit"
            className="color"
            onClick={handleSubmit(Submit, (e) => {
              console.log(e);
            })}
            disabled={!isDirty}
          >
            送信
          </button>
        </div>
      </form>
    </Modal>
  );
}
