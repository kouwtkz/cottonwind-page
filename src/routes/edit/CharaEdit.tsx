import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { create } from "zustand";
import { UrlObject } from "url";
import { useAtom } from "jotai";
import { dataIsCompleteAtom } from "@/state/StateSet";
import {
  MdAdd,
  MdClose,
  MdDoneOutline,
  MdEditNote,
  MdFileDownload,
  MdFileUpload,
} from "react-icons/md";
import { TbArrowsMove } from "react-icons/tb";
import { LinkMee } from "@/functions/doc/MakeURL";
import ReactSelect from "react-select";
import axios from "axios";
import toast from "react-hot-toast";
import {
  charactersAtom,
  charactersMapAtom,
  characterTagsAtom,
} from "@/state/CharaState";
import { SoundState, useSoundState } from "@/state/SoundState";
import { ImageMeeIcon } from "@/layout/ImageMee";
import { callReactSelectTheme } from "@/theme/main";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS as dndCSS } from "@dnd-kit/utilities";
import { CharaListItem } from "../CharaPage";
import { ToFormJST } from "@/functions/DateFormat";
import { ContentsTagsOption } from "@/components/dropdown/SortFilterTags";
import { EditTagsReactSelect } from "@/components/dropdown/EditTagsReactSelect";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDownload } from "@/components/FileTool";
import { ApiOriginAtom } from "@/state/EnvState";
import { charactersLoadAtom } from "@/state/DataState";

export default function CharaEditForm() {
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const nav = useNavigate();
  const { charaName } = useParams();
  const charactersMap = useAtom(charactersMapAtom)[0];
  const setCharactersLoad = useAtom(charactersLoadAtom)[1];
  const characterTags = useAtom(characterTagsAtom)[0];
  const soundState = useSoundState();
  const chara =
    charactersMap && charaName ? charactersMap.get(charaName) : null;
  const getDefaultValues = useCallback(
    (chara?: CharacterType | null) => ({
      id: chara?.id || charaName || "",
      name: chara?.name || "",
      honorific: chara?.honorific || "",
      overview: chara?.overview || "",
      description: chara?.description || "",
      defEmoji: chara?.defEmoji || "",
      icon: chara?.icon || "",
      image: chara?.image || "",
      headerImage: chara?.headerImage || "",
      time: ToFormJST(chara?.time),
      birthday: ToFormJST(chara?.birthday),
      tags: chara?.tags || [],
      playlist: chara?.playlist || [],
    }),
    []
  );

  const playlistOptions = useMemo(
    () =>
      [{ label: "デフォルト音楽", value: "default" }].concat(
        soundState.SoundItemList.map((s) => ({
          label: s.title,
          value: s.src.slice(s.src.lastIndexOf("/") + 1),
        }))
      ) as ContentsTagsOption[],
    [soundState.SoundItemList]
  );

  const [tagsOptions, setTagsOptions] = useState([] as ContentsTagsOption[]);
  useEffect(() => {
    setTagsOptions(characterTags);
  }, [characterTags]);

  const schema = z.object({
    id: z
      .string()
      .min(1, { message: "IDは1文字以上必要です！" })
      .refine(
        (id) => {
          return !(charactersMap && chara?.id !== id && id in charactersMap);
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
    if (!charactersMap) return;
    const formData = new FormData();
    Object.entries(formValues).forEach(([key, value]) => {
      if (key in dirtyFields)
        switch (key) {
          default:
            if (Array.isArray(value)) {
              if (value.length > 0) {
                value.forEach((v) => {
                  formData.append(`${key}[]`, v);
                });
              } else {
                formData.append(`${key}`, "");
              }
            } else {
              formData.append(key, value);
            }
            break;
        }
    });
    if (chara?.id) formData.append("target", chara.id);
    else if (!formData.has("id")) formData.append("id", formValues["id"]);
    toast
      .promise(
        fetch(apiOrigin + "/character/send", {
          method: "POST",
          body: formData,
        }),
        {
          loading: "送信中",
          success: (res) => {
            switch (res.status) {
              case 200:
                return "キャラクターの更新しました";
              case 201:
                return "キャラクターを新たに作成しました";
              default:
                return "キャラクターデータが更新されました";
            }
          },
          error: "送信に失敗しました",
        }
      )
      .then(() => {
        setCharactersLoad(true);
        nav(`/character/${formValues.id}`);
      });
  }

  return (
    <form className="edit">
      <SoundState />
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
        <input placeholder="キャラクターID" {...register("id")} />
        {"id" in errors ? (
          <p className="warm">{errors.id?.message?.toString()}</p>
        ) : null}
      </div>
      <div className="flex">
        <input placeholder="名前" {...register("name")} />
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
        <textarea placeholder="概要" {...register("overview")} />
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
      <div className="flex column">
        <label className="flex center">
          <span className="label-l">できた日</span>
          <input
            className="flex-1"
            placeholder="初めてキャラクターができた日"
            step={1}
            type="datetime-local"
            {...register("time")}
          />
        </label>
        <label className="flex center">
          <span className="label-l">お誕生日</span>
          <input
            className="flex-1"
            placeholder="キャラクターの誕生日"
            step={1}
            type="datetime-local"
            {...register("birthday")}
          />
        </label>
      </div>
      <div>
        <EditTagsReactSelect
          name="tags"
          tags={tagsOptions}
          set={setTagsOptions}
          control={control}
          setValue={setValue}
          getValues={getValues}
          placeholder="タグ"
          enableEnterAdd
          styles={{
            menuList: (style) => ({ ...style, textAlign: "left" }),
            option: (style) => ({ ...style, paddingLeft: "1em" }),
          }}
        />
      </div>
      <div>
        <Controller
          control={control}
          name="playlist"
          render={({ field }) => (
            <ReactSelect
              instanceId="CharaPlaylistSelect"
              theme={callReactSelectTheme}
              isMulti
              options={playlistOptions}
              styles={{
                menuList: (style) => ({ ...style, textAlign: "left" }),
                option: (style) => ({ ...style, paddingLeft: "1em" }),
              }}
              value={(field.value as string[]).map((fv) =>
                playlistOptions.find(({ value }) => value === fv)
              )}
              placeholder="プレイリスト"
              onChange={(newValues) => {
                field.onChange(newValues.map((v) => v?.value));
              }}
              onBlur={field.onBlur}
            />
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
          type="button"
          onClick={handleSubmit(onSubmit)}
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
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const [isComplete] = useAtom(dataIsCompleteAtom);
  const { charaName } = useParams();
  const { sortable, set: setEditSwitch } = useEditSwitchState();
  if (!isComplete) return <></>;
  const Url: UrlObject = { pathname: "/character" };
  Url.query = charaName ? { mode: "edit", name: charaName } : { mode: "add" };
  return (
    <RbButtonArea
      dropdown={
        <>
          <button
            type="button"
            className="round large"
            title="キャラデータのダウンロード"
            onClick={async () => {
              fileDownload(
                "characters.json",
                await fetch(apiOrigin + "/characters/data").then((r) =>
                  r.text()
                )
              );
            }}
          >
            <MdFileDownload />
          </button>
          <button
            type="button"
            className="round large"
            title="キャラデータのアップロード"
            onClick={() => {}}
          >
            <MdFileUpload />
          </button>
        </>
      }
    >
      {charaName ? null : sortable ? (
        <>
          <button
            type="button"
            className="round"
            title="ソートの中止"
            onClick={() =>
              setEditSwitch({ sortable: false, save: false, reset: true })
            }
          >
            <MdClose />
          </button>
          <button
            type="button"
            className="round"
            title="ソートの完了"
            onClick={() => setEditSwitch({ sortable: false, save: true })}
          >
            <MdDoneOutline />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="round large"
          title="ソートモードにする"
          onClick={() =>
            setEditSwitch({ sortable: true, save: false, reset: false })
          }
        >
          <TbArrowsMove />
        </button>
      )}
      <LinkMee
        to={{ query: { edit: "on" } }}
        className="button round large"
        title={charaName ? "キャラクターの編集" : "キャラクターの追加"}
      >
        {charaName ? <MdEditNote /> : <MdAdd />}
      </LinkMee>
    </RbButtonArea>
  );
}

export function SortableObject() {
  const [characters, setCharacters] = useAtom(charactersAtom);
  const setCharactersLoad = useAtom(charactersLoadAtom)[1];
  const [items, setItems] = useState(characters || []);
  useEffect(() => {
    if (characters) setItems(characters);
  }, [characters]);
  const {
    sortable,
    save: saveFlag,
    reset: resetFlag,
    set,
  } = useEditSwitchState();
  useEffect(() => {
    if (characters && !sortable) {
      if (saveFlag) {
        const isDirty = !items.every(({ id }, i) => characters[i].id === id);
        if (isDirty) {
          setCharacters(items);
          const formData = new FormData();
          items.forEach(({ id }) => formData.append("sorts[]", id));
          axios.post("/character/send", formData).then((res) => {
            toast(res.data.message, { duration: 2000 });
            if (res.status === 200) {
              if (res.data.update.chara) setCharactersLoad(true);
            }
          });
        }
        set({ save: false });
      } else if (resetFlag) {
        setItems(characters);
        set({ reset: false });
      }
    }
  }, [characters, items, resetFlag, saveFlag, sortable]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) {
        return;
      }
      if (active.id !== over.id) {
        const oldIndex = items.findIndex((v) => v.id === active.id);
        const newIndex = items.findIndex((v) => v.id === over.id);
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items]
  );
  return (
    <>
      <div className="charaList" hidden={!sortable}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            {items.map((chara) => {
              return <SortableItem chara={chara} key={chara.id} />;
            })}
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}

function SortableItem({ chara }: { chara: CharacterType }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: chara.id });
  const style: CSSProperties = {
    cursor: "move",
    listStyle: "none",
    transform: dndCSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      className="item"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CharaListItem chara={chara} />
    </div>
  );
}
