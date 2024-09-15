import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostTextarea, usePreviewMode } from "@/components/parse/PostTextarea";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { HotkeyRunEvent } from "@/components/hook/EventSet";
import * as z from "zod";
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SetRegister from "@/components/hook/SetRegister";
import axios from "axios";
import { postsAtom } from "@/state/PostState";
import { findMee } from "@/functions/findMee";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "@/theme/main";
import { create } from "zustand";
import {
  MenuItem,
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "@/components/dropdown/PostEditSelect";
import { DropdownObject } from "@/components/dropdown/DropdownMenu";
import { useAtom } from "jotai";
import { ApiOriginAtom } from "@/state/EnvState";
import { fileDownload } from "@/components/FileTool";
import {
  imageDataObject,
  ImportPostJson,
  postsDataObject,
} from "@/state/DataState";
import { concatOriginUrl } from "@/functions/originUrl";
import { corsFetch, corsFetchJSON } from "@/functions/fetch";
import {
  dateJISOfromDate,
  dateISOfromLocaltime,
} from "@/functions/DateFunctions";

const backupStorageKey = "backupPostDraft";

export const useLocalDraftPost = create<{
  localDraft: PostType | null;
  setLocalDraft: (post: FieldValues | PostType | null) => void;
  getLocalDraft: () => PostType | null;
  removeLocalDraft: () => void;
}>((set) => ({
  localDraft: null,
  setLocalDraft(post) {
    localStorage.setItem(backupStorageKey, JSON.stringify(post));
    set({ localDraft: post as PostType | null });
  },
  getLocalDraft() {
    const itemStr = localStorage.getItem(backupStorageKey);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr) as any;
    item.time = item.time ? new Date(item.time) : undefined;
    item.localDraft = true;
    const post = item as PostType;
    set({ localDraft: post });
    return item as PostType;
  },
  removeLocalDraft() {
    localStorage.removeItem(backupStorageKey);
    set({ localDraft: null });
  },
}));

type labelValues = { label: string; value: string }[];

const schema = z.object({
  update: z.string(),
  postId: z.string(),
  title: z.string().nullish(),
  body: z.string().min(1, { message: "本文を入力してください" }),
  time: z.string().nullish(),
  pin: z.coerce.number().nullish(),
  draft: z.boolean().nullish(),
  attached: z.custom<FileList>().nullish(),
});

export function PostForm() {
  const [searchParams] = useSearchParams();
  const Location = useLocation();
  const posts = useAtom(postsAtom)[0];
  const setPostsLoad = useAtom(postsDataObject.loadAtom)[1];
  const [apiOrigin] = useAtom(ApiOriginAtom);

  const nav = useNavigate();
  const base = searchParams.get("base");
  const duplicationMode = Boolean(base);
  const targetPostId = searchParams.get("target") || base;
  const postTarget = targetPostId
    ? findMee({ list: posts, where: { postId: targetPostId }, take: 1 })[0]
    : null;
  const updateMode = postTarget && !duplicationMode;

  const categoryCount = useMemo(
    () =>
      posts
        ? posts.reduce((prev, cur) => {
            const categories = cur.category;
            categories?.forEach((category) => {
              if (category) prev[category] = (prev[category] || 0) + 1;
            });
            return prev;
          }, {} as { [K: string]: number })
        : 0,
    [posts]
  );
  const getCategoryLabelValues = useCallback(() => {
    return Object.entries(categoryCount).map(([name, count]) => ({
      label: `${name} (${count})`,
      value: name,
    }));
  }, [categoryCount]);
  const [categoryList, setCategoryList] = useState<labelValues>(
    getCategoryLabelValues()
  );

  const postCategories = useMemo(
    () =>
      postTarget
        ? typeof postTarget.category === "string"
          ? [postTarget.category]
          : postTarget.category
        : [],
    [postTarget]
  );

  const { togglePreviewMode } = usePreviewMode();

  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const AttachedRef = useRef<HTMLInputElement | null>(null);
  const postIdRef = useRef<HTMLInputElement | null>(null);

  const defaultValues = useMemo(
    () => ({
      update: duplicationMode ? "" : postTarget?.postId || "",
      postId: duplicationMode ? undefined : postTarget?.postId || "",
      title: postTarget?.title || "",
      body: postTarget?.body || "",
      category: postCategories,
      time: dateJISOfromDate(postTarget?.time),
      pin: Number(postTarget?.pin || 0),
      draft: Boolean(postTarget?.draft),
    }),
    [duplicationMode, postCategories, postTarget]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitted },
    getValues,
    setValue,
    reset,
    control,
  } = useForm<FieldValues>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { getLocalDraft, localDraft, setLocalDraft, removeLocalDraft } =
    useLocalDraftPost();
  useEffect(() => {
    getLocalDraft();
  }, [getLocalDraft]);

  useEffect(() => {
    if (Location.state?.draft) {
      reset({
        ...defaultValues,
        ...localDraft,
        time: dateJISOfromDate(localDraft?.time),
      });
      setCategoryList((c) => {
        const draftOnlyCategory =
          localDraft?.category?.filter((item) =>
            c.every(({ value }) => value !== item)
          ) || [];
        if (draftOnlyCategory.length > 0)
          return c.concat(
            draftOnlyCategory.map((d) => ({ value: d, label: d }))
          );
        else return c;
      });
    } else {
      reset(defaultValues);
    }
  }, [reset, localDraft, defaultValues, Location.state]);

  function saveLocalDraft() {
    const values = getValues();
    values.time = dateISOfromLocaltime(values.time);
    setLocalDraft(values);
  }

  const refIsDirty = useRef(false);
  useEffect(() => {
    refIsDirty.current = isDirty;
  }, [isDirty]);
  const refIsSubmitted = useRef(false);
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (refIsDirty.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (refIsDirty.current && !refIsSubmitted.current) {
        saveLocalDraft();
      }
    };
  }, []);

  const onChangePostId = () => {
    const answer = prompt("記事のID名の変更", getValues("postId"));
    if (answer !== null) {
      setValue("postId", answer);
    }
  };
  const onDuplication = () => {
    if (confirm("記事を複製しますか？")) {
      nav(location.pathname + location.search.replace("target=", "base="), {
        replace: true,
      });
    }
  };
  const onDelete = () => {
    if (/target=/.test(location.search) && confirm("本当に削除しますか？")) {
      toast
        .promise(
          corsFetch(concatOriginUrl(apiOrigin, "/blog/send"), {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            } as ContentTypeHeader,
            body: JSON.stringify({ postId: getValues("postId") }),
          }).then(async (r) => {
            if (r.ok) return r;
            else throw await r.text();
          }),
          {
            loading: "削除中",
            success: "削除しました",
            error: (e) => "削除に失敗しました" + (e ? `\n[${e}]` : ""),
          }
        )
        .then((r) => {
          if (r.ok) {
            setPostsLoad("no-cache");
            nav("/blog", { replace: true });
          }
        });
    }
  };
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast.error(
        Object.entries(errors)
          .map(([key, err]) => `${key}: ${err?.message} [${err?.type}]`)
          .join("\n"),
        { duration: 2000 }
      );
    }
  });
  const setImagesLoad = useAtom(imageDataObject.loadAtom)[1];

  useHotkeys("b", () => nav(-1));

  HotkeyRunEvent({
    keys: "ctrl+enter",
    element: formRef.current,
    type: "submit",
    enableOnFormTags: true,
  });

  useHotkeys(
    "escape",
    (e) => {
      ((document.activeElement || document.body) as HTMLElement).blur();
      e.preventDefault();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "ctrl+period",
    () => {
      togglePreviewMode(textareaRef.current?.value);
    },
    { enableOnFormTags: ["TEXTAREA"] }
  );

  useHotkeys("n", (e) => {
    textareaRef.current?.focus();
    e.preventDefault();
  });

  const CategorySelect = useCallback(
    () => (
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <ReactSelect
            placeholder="カテゴリ"
            instanceId="blogTagSelect"
            className="flex-1"
            styles={{
              control: (provided) => ({
                ...provided,
                textAlign: "left",
              }),
            }}
            theme={callReactSelectTheme}
            isMulti
            options={categoryList}
            value={(field.value as string[]).map((fv) =>
              categoryList.find((ci) => ci.value === fv)
            )}
            onChange={(newValues) => {
              field.onChange(newValues.map((v) => v?.value));
            }}
            onBlur={field.onBlur}
          />
        )}
      />
    ),
    [categoryList, control]
  );

  const onSubmit: SubmitHandler<FieldValues> = useCallback(async () => {
    let sendEnable = false;
    let attached = false;
    let values = getValues();
    const data = {} as KeyValueAnyType;
    const append = (name: string, value: string | Blob, sendCheck = true) => {
      data[name] = value;
      if (sendCheck && !sendEnable) sendEnable = true;
    };
    try {
      Object.entries(values).forEach(([key, item]) => {
        const defaultItem = (defaultValues as { [k: string]: any })[key];
        switch (key) {
          case "postId":
            append(key, item, item !== defaultItem);
            break;
          case "update":
            append(key, item, false);
            break;
          case "time":
            if (item !== defaultItem) append(key, dateISOfromLocaltime(item));
            break;
          case "category":
            const value = item.join(",");
            if (postCategories?.join(",") !== value) append(key, value);
            break;
          default:
            if (item !== defaultItem && !(item === "" && !defaultItem))
              append(key, item);
            break;
        }
      });
      if (sendEnable) {
        toast
          .promise(
            corsFetchJSON(concatOriginUrl(apiOrigin, "/blog/send"), data).then(
              async (r) => {
                if (r.ok) return r;
                else throw await r.text();
              }
            ),
            {
              loading: "送信中",
              success: (r) =>
                r.status === 200 ? "更新しました" : "投稿しました",
              error: (e) => "送信に失敗しました" + (e ? `\n[${e}]` : ""),
            }
          )
          .then(async (r) => {
            refIsSubmitted.current = true;
            setPostsLoad("no-cache");
            if (attached) setImagesLoad("no-cache");
            return (await r.json()) as KeyValueType<string>;
          })
          .then((data) => {
            if (data.postId) {
              nav(`/blog?postId=${data.postId}`, { replace: true });
            } else {
              nav(`/blog`, { replace: true });
            }
          });
      } else {
        toast.error("更新するデータがありませんでした", { duration: 2000 });
      }
    } catch (error) {
      toast.error("エラーが発生しました", { duration: 2000 });
      console.error(error);
    }
  }, [apiOrigin, defaultValues, getValues, postCategories, nav, updateMode]);

  return (
    <>
      <form
        method={"POST"}
        action={apiOrigin + "/blog/send"}
        id="postForm"
        ref={formRef}
        encType="multipart/form-data"
        className="blogEdit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1>Post form</h1>
        <input {...register("update")} type="hidden" />
        <input
          {...SetRegister({ name: "postId", ref: postIdRef, register })}
          type="hidden"
        />
        <input
          {...register("title")}
          type="text"
          placeholder="タイトル"
          className="title"
        />
        <div className="category">
          <CategorySelect />
          <button
            title="新規カテゴリ"
            type="button"
            className="add text"
            onClick={() => {
              const answer = prompt("新規カテゴリーを入力してください");
              if (answer !== null) {
                const newCategory = { label: answer, value: answer };
                setCategoryList((c) => c.concat(newCategory));
                setValue("category", getValues("category").concat(answer), {
                  shouldDirty: true,
                });
              }
            }}
          >
            新規
          </button>
        </div>
        <div className="modifier">
          <label className="tight">
            <input
              {...register("pin")}
              title="ピン留め"
              id="pinNumber"
              type="number"
              min="-128"
              max="127"
              placeholder="pin"
              className="pin"
            />
            <span>ピン</span>
          </label>
          <label className="tight">
            <input {...register("draft")} type="checkbox" />
            <span>下書き</span>
          </label>
          <input
            {...register("time")}
            type="datetime-local"
            placeholder="日付"
            title="日付"
            step={1}
            className="date tight"
          />
        </div>
        <div className="modifier">
          <PostEditSelectMedia textarea={textareaRef.current} />
          <PostEditSelectDecoration textarea={textareaRef.current} />
          <PostEditSelectInsert textarea={textareaRef.current} />
          <DropdownObject
            MenuButton="操作"
            onClick={(e) => {
              switch (e.dataset.value) {
                case "postid":
                  onChangePostId();
                  break;
                case "duplication":
                  onDuplication();
                  break;
                case "delete":
                  onDelete();
                  break;
                case "download":
                  if (confirm("記事データを一括で取得しますか？")) {
                    fileDownload(
                      postsDataObject.storage.key + ".json",
                      JSON.stringify(postsDataObject.storage)
                    );
                  }
                  break;
                case "upload":
                  ImportPostJson({ apiOrigin }).then(() => {
                    setPostsLoad("no-cache-reload");
                    nav(`/blog`, { replace: true });
                  });
              }
            }}
          >
            <MenuItem value="postid">ID名</MenuItem>
            <MenuItem value="duplication">複製</MenuItem>
            <MenuItem value="delete">削除</MenuItem>
            <MenuItem value="download">全取得</MenuItem>
            <MenuItem value="upload">全上書</MenuItem>
          </DropdownObject>
        </div>
        <PostTextarea
          registed={SetRegister({ name: "body", ref: textareaRef, register })}
          id="post_body_area"
          placeholder="今何してる？"
          className="body"
        />
        <input
          {...SetRegister({
            name: "attached",
            onChange: () =>
              setAttached({
                inputAttached: AttachedRef.current,
                textarea: textareaRef.current,
              }),
            ref: AttachedRef,
            register,
          })}
          type="file"
          accept="image/*"
          placeholder="画像選択"
          multiple
          style={{ display: "none" }}
        />
        <div className="action">
          <button
            type="button"
            className="text"
            onClick={() => togglePreviewMode(getValues("body"))}
          >
            プレビュー
          </button>
          <button className="text" type="submit">
            {updateMode ? "更新する" : "投稿する"}
          </button>
        </div>
      </form>
    </>
  );
}

export function setCategory({
  selectCategory,
  newCategoryBase,
}: {
  selectCategory: HTMLSelectElement | null;
  newCategoryBase: HTMLOptionElement | null;
}) {
  if (!selectCategory || !newCategoryBase) return;
  if (selectCategory.value === "new") {
    const answer = prompt("新規カテゴリーを入力してください");
    if (answer === null || answer === "new") {
      selectCategory.value = selectCategory.dataset.before || "";
    } else if (answer && !selectCategory.querySelector(`[value="${answer}"]`)) {
      const newCategoryID = "newCategory";
      let newCategory = selectCategory.querySelector(
        `option#${newCategoryID}`
      ) as HTMLOptionElement;
      if (!newCategory) {
        newCategory = document.createElement("option");
        newCategory.id = newCategoryID;
        newCategoryBase.after(newCategory as any);
      }
      newCategory.value = answer;
      newCategory.innerText = answer;
      selectCategory.value = answer;
    } else {
      selectCategory.value = answer;
    }
  }
  selectCategory.dataset.before = selectCategory.value;
}

function setAttached({
  inputAttached,
  textarea,
}: {
  inputAttached: HTMLInputElement | null;
  textarea: HTMLTextAreaElement | null;
}) {
  if (!inputAttached || !textarea) return;
  const files = inputAttached.files || [];
  Array.from(files).forEach((file) => {
    const filename = file.name;
    const uploadname = filename.replaceAll(" ", "_");
    if (!textarea.value.match(uploadname)) {
      const value = `\n![](?image=${uploadname}&pic)`;
      textarea.setRangeText(value);
      textarea.focus();
    }
  });
  inputAttached.style.display = files.length === 0 ? "none" : "";
}
