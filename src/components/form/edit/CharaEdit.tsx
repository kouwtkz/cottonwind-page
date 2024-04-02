import { CSSProperties, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { create } from "zustand";
import { UrlObject } from "url";
import { useDataState } from "../../../state/StateSet";
import { MdAdd, MdClose, MdDoneOutline, MdEditNote } from "react-icons/md";
import { TbArrowsMove } from "react-icons/tb";
import { LinkMee } from "../../doc/MakeURL";
import ReactSelect from "react-select";
import axios from "axios";
import toast from "react-hot-toast";
import { useCharaState } from "../../../state/CharaState";
import { useImageState } from "../../../state/ImageState";
import { useSoundState } from "../../../state/SoundState";
import { ImageMeeIcon } from "../../layout/ImageMee";
import { CharaType } from "../../../types/CharaType";
import { callReactSelectTheme } from "../../theme/main";

export default function CharaEditForm() {
  const nav = useNavigate();
  const { name } = useParams();
  const { charaObject, setIsSet } = useCharaState();
  const imageState = useImageState();
  const soundState = useSoundState();
  const chara = charaObject && name ? charaObject[name] : null;
  const getDefaultValues = useCallback(
    (chara: CharaType | null) => ({
      id: chara?.id || "",
      name: chara?.name || "",
      honorific: chara?.honorific || "",
      overview: chara?.overview || "",
      description: chara?.description || "",
      defEmoji: chara?.defEmoji || "",
      icon: chara?.icon || "",
      image: chara?.image || "",
      headerImage: chara?.headerImage || "",
      playlist: chara?.playlist || [],
    }),
    []
  );
  const playlistOptions = useMemo(
    () =>
      [{ label: "デフォルト", value: "default" }].concat(
        soundState.SoundItemList.map((s) => ({
          label: s.title,
          value: s.src.slice(s.src.lastIndexOf("/") + 1),
        }))
      ),
    [soundState.SoundItemList]
  );
  const schema = z.object({
    id: z
      .string()
      .min(1, { message: "IDは1文字以上必要です！" })
      .refine(
        (id) => {
          return !(charaObject && chara?.id !== id && id in charaObject);
        },
        { message: "既に使用しているIDです！" }
      ),
    name: z.string().min(1, { message: "名前は1文字以上必要です！" }),
  });

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { isDirty, defaultValues, errors, dirtyFields },
  } = useForm<FieldValues>({
    defaultValues: getDefaultValues(chara),
    resolver: zodResolver(schema),
  });
  useEffect(() => {
    reset(getDefaultValues(chara));
  }, [chara, getDefaultValues, reset]);

  async function onSubmit() {
    const formValues = getValues();
    if (!charaObject) return;
    const formData = new FormData();
    if (chara?.id) formData.append("target", chara.id);
    Object.entries(formValues).forEach(([key, value]) => {
      if (key in dirtyFields)
        switch (key) {
          case "playlist":
            const arr = value as string[];
            if (arr.length > 0) {
              arr.forEach((v) => {
                formData.append(`${key}[]`, v);
              });
            } else {
              formData.append(`${key}`, "");
            }
            break;
          default:
            formData.append(key, value);
            break;
        }
    });
    const res = await axios.post("/character/send", formData);
    toast(res.data.message, { duration: 2000 });
    if (res.status === 200) {
      if (res.data.update.chara) setIsSet(false);
      if (res.data.update.image) imageState.setImageFromUrl();
      setTimeout(() => {
        nav(`/character/${formValues.id}`);
      }, 200);
    }
  }

  return (
    <form
      className="edit"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        {chara?.media?.icon ? (
          <ImageMeeIcon
            imageItem={chara.media.icon}
            size={40}
            className="charaIcon"
          />
        ) : null}
      </div>
      <div>
        <input
          placeholder="キャラクターID"
          {...register("id")}
        />
        {"id" in errors ? (
          <p className="warm">{errors.id?.message?.toString()}</p>
        ) : null}
      </div>
      <div className="flex">
        <input
          placeholder="名前"
          {...register("name")}
        />
        <input placeholder="敬称" {...register("honorific")} />
        <input
          className="mini"
          placeholder="絵文字"
          {...register("defEmoji")}
        />
        {"name" in errors ? (
          <p className="warm">{errors.name?.message?.toString()}</p>
        ) : null}
      </div>
      <div>
        <textarea
          placeholder="概要"
          {...register("overview")}
        />
      </div>
      <div className="flex column">
        <label className="flex center">
          <span className="label-l">アイコン</span>
          <input
            className="flex-1"
            placeholder="自動設定"
            {...register("icon")}
          />
        </label>
        <label className="flex center">
          <span className="label-l">ヘッダー画像</span>
          <input
            className="flex-1"
            placeholder="ヘッダー画像"
            {...register("headerImage")}
          />
        </label>
        <label className="flex center">
          <span className="label-l">メイン画像</span>
          <input
            className="flex-1"
            placeholder="メイン画像"
            {...register("image")}
          />
        </label>
      </div>
      <div>
        <Controller
          control={control}
          name="playlist"
          render={({ field }) => (
            <ReactSelect
              instanceId="CharaTagSelect"
              theme={callReactSelectTheme}
              isMulti
              options={playlistOptions}
              value={(field.value as string[]).map((fv) =>
                playlistOptions.find(({ value }) => value === fv)
              )}
              placeholder="プレイリスト"
              onChange={(newValues) => {
                field.onChange(newValues.map((v) => v?.value));
              }}
              onBlur={field.onBlur}
            ></ReactSelect>
          )}
        />
      </div>
      <div>
        <textarea
          placeholder="詳細"
          className="description"
          {...register("description")}
        />
      </div>
      <div>
        <button
          disabled={!isDirty}
          type="submit"
        >
          送信
        </button>
      </div>
    </form>
  );
}

export const useEditSwitchState = create<{
  save: boolean;
  reset: boolean;
  sortable: boolean;
  set: (args: { sortable?: boolean; reset?: boolean; save?: boolean }) => void;
}>((set) => ({
  save: false,
  reset: false,
  sortable: false,
  set(args) {
    set(args);
  },
}));

export function CharaEditButton() {
  const { isComplete } = useDataState();
  const { name } = useParams();
  const { sortable, set: setEditSwitch } = useEditSwitchState();
  if (!isComplete) return <></>;
  const Url: UrlObject = { pathname: "/character" };
  Url.query = name ? { mode: "edit", name } : { mode: "add" };
  const style: CSSProperties = {
    margin: "0.5rem",
    width: "3rem",
    height: "3rem",
    borderRadius: "9999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div className="rbButtonArea z30">
      {name ? null : sortable ? (
        <>
          <button
            type="button"
            className="round"
            title="ソートの中止"
            onClick={() =>
              setEditSwitch({ sortable: false, save: false, reset: true })
            }
            style={style}
          >
            <MdClose />
          </button>
          <button
            type="button"
            className="round"
            title="ソートの完了"
            onClick={() => setEditSwitch({ sortable: false, save: true })}
            style={style}
          >
            <MdDoneOutline />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="round"
          title="ソートモードにする"
          onClick={() =>
            setEditSwitch({ sortable: true, save: false, reset: false })
          }
          style={style}
        >
          <TbArrowsMove />
        </button>
      )}
      <LinkMee
        to={{ query: { edit: "on" } }}
        style={style}
        className="button round large"
      >
        {name ? <MdEditNote /> : <MdAdd />}
      </LinkMee>
    </div>
  );
}
