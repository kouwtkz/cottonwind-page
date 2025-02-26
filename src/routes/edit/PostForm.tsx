import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostTextarea, usePreviewMode } from "@/components/parse/PostTextarea";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
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
import { usePosts } from "@/state/PostState";
import { findMee } from "@/functions/find/findMee";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "@/components/define/callReactSelectTheme";
import {
  MenuItem,
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "@/components/dropdown/PostEditSelect";
import { DropdownObject } from "@/components/dropdown/DropdownMenu";
import { useApiOrigin } from "@/state/EnvState";
import {
  imageDataObject,
  ImportPostJson,
  postsDataObject,
} from "@/state/DataState";
import { concatOriginUrl } from "@/functions/originUrl";
import { corsFetchJSON } from "@/functions/fetch";
import { IsoFormTime, ToFormTime } from "@/functions/DateFunction";
import { SendDelete } from "@/functions/sendFunction";
import { DownloadDataObject } from "@/components/button/ObjectDownloadButton";
import { CreateObjectState } from "@/state/CreateState";

const backupStorageKey = "backupPostDraft";

export const useLocalDraftPost = CreateObjectState<{
  localDraft: PostFormDraftType | null;
  setLocalDraft: (post: FieldValues | PostFormDraftType | null) => void;
  getLocalDraft: () => PostFormDraftType | null;
  removeLocalDraft: () => void;
}>((set) => ({
  localDraft: null,
  setLocalDraft(post) {
    localStorage.setItem(backupStorageKey, JSON.stringify(post));
    set({ localDraft: post as PostFormDraftType | null });
  },
  getLocalDraft() {
    const itemStr = localStorage.getItem(backupStorageKey);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr) as any;
    item.time = item.time ? new Date(item.time) : undefined;
    item.localDraft = true;
    const post = item as PostFormDraftType;
    set({ localDraft: post });
    return item as PostFormDraftType;
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
  const posts = usePosts()[0];
  const setPostsLoad = postsDataObject.useLoad()[1];
  const apiOrigin = useApiOrigin()[0];

  const nav = useNavigate();
  const base = searchParams.get("base");
  const duplicationMode = Boolean(base);
  const targetPostId = searchParams.get("target") || base;
  const draft = searchParams.get("draft");
  const isLocalDraft = draft === "local";
  const postTarget = useMemo(
    () =>
      targetPostId && posts
        ? findMee(posts, { where: { postId: targetPostId }, take: 1 })[0]
        : null,
    [posts, targetPostId]
  );
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
  const postIdRef = useRef<HTMLInputElement | null>(null);

  const values = useMemo(
    () => ({
      update: duplicationMode ? "" : postTarget?.postId || "",
      postId: duplicationMode ? null : postTarget?.postId || "",
      title: postTarget?.title || "",
      body: postTarget?.body || "",
      category: postCategories ?? null,
      time: ToFormTime(postTarget?.time),
      pin: Number(postTarget?.pin || 0),
      draft: postTarget?.draft ?? null,
    }),
    [duplicationMode, postCategories, postTarget]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    getValues,
    setValue,
    reset,
    control,
  } = useForm<FieldValues>({
    values,
    resolver: zodResolver(schema),
  });

  function setBody(v: any) {
    setValue("body", v, {
      shouldDirty: true,
    });
  }

  const { getLocalDraft, localDraft, setLocalDraft, removeLocalDraft } =
    useLocalDraftPost();
  useEffect(() => {
    getLocalDraft();
  }, [getLocalDraft]);

  useEffect(() => {
    if (isLocalDraft) {
      reset({
        ...values,
        ...localDraft,
        time: ToFormTime(localDraft?.time),
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
    }
  }, [reset, localDraft, values, isLocalDraft]);

  function saveLocalDraft() {
    const values = getValues();
    values.time = IsoFormTime(values.time);
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
      SendDelete({
        url: concatOriginUrl(apiOrigin, "/blog/send"),
        data: { postId: getValues("postId") },
      }).then((r) => {
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
        { autoClose: 2000 }
      );
    }
  });
  const setImagesLoad = imageDataObject.useLoad()[1];

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
        const defaultItem = (values as { [k: string]: any })[key];
        switch (key) {
          case "postId":
            append(key, item, item !== defaultItem);
            break;
          case "update":
            append(key, item, false);
            break;
          case "time":
            if (item !== defaultItem) append(key, IsoFormTime(item));
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
              pending: "送信中",
              success: {
                render({ data: r }) {
                  return r.status === 200 ? "更新しました" : "投稿しました";
                },
              },
              error: {
                render({ data: e }) {
                  return "送信に失敗しました" + (e ? `\n[${e}]` : "");
                },
              },
            }
          )
          .then(async (r) => {
            refIsSubmitted.current = true;
            setPostsLoad("no-cache");
            if (attached) setImagesLoad("no-cache");
            return (await r.json()) as KeyValueType<string>;
          })
          .then((data) => {
            if (localDraft) {
              if (
                !(values.update || localDraft.update) ||
                values.update === localDraft.update
              ) {
                removeLocalDraft();
              }
            }
            if (data.postId) {
              nav(`/blog?postId=${data.postId}`, { replace: true });
            } else {
              nav(`/blog`, { replace: true });
            }
          });
      } else {
        toast.error("更新するデータがありませんでした", { autoClose: 2000 });
      }
    } catch (error) {
      toast.error("エラーが発生しました", { autoClose: 2000 });
      console.error(error);
    }
  }, [
    apiOrigin,
    values,
    getValues,
    postCategories,
    nav,
    updateMode,
    localDraft,
    removeLocalDraft,
  ]);

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
        <h1 className="en-title-font">Post form</h1>
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
            className="color add text"
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
          <PostEditSelectMedia
            textarea={textareaRef.current}
            album="blog"
            setValue={setBody}
          />
          <PostEditSelectDecoration
            textarea={textareaRef.current}
            setValue={setBody}
          />
          <PostEditSelectInsert
            textarea={textareaRef.current}
            setValue={setBody}
          />
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
                    DownloadDataObject(postsDataObject);
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
        <div className="action">
          <button
            className="color text"
            type="reset"
            disabled={!isDirty}
            onClick={(e) => {
              e.preventDefault();
              reset(values);
            }}
          >
            リセット
          </button>
          <button
            type="button"
            className="color text"
            onClick={() => togglePreviewMode(getValues("body"))}
          >
            プレビュー
          </button>
          <button className="color text" type="submit">
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
