import {
  Link,
  type NavigateOptions,
  type To,
  type URLSearchParamsInit,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  useImageState,
  useSelectImageState,
} from "~/components/state/ImageState";
import React, {
  type ReactNode,
  createRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  defineSortTags,
  filterGalleryMonthList,
  addExtentionTagsOptions,
  defaultGalleryTags,
  MonthToTag,
  TimeframeTags,
  simpleDefaultTags,
} from "~/components/dropdown/SortFilterTags";
import { filterPickFixed } from "~/components/functions/media/FilterImages";
import { InPageMenu } from "~/components/layout/InPageMenu";
import { useDropzone } from "react-dropzone";
import {
  RiBook2Fill,
  RiChatPrivateLine,
  RiCupFill,
  RiFilePdf2Fill,
  RiHazeFill,
  RiHomeGearLine,
  RiKeynoteFill,
  RiLandscapeFill,
  RiMenuSearchLine,
  RiMoonFill,
  RiMoonFoggyFill,
  RiPlayLargeFill,
  RiPushpin2Line,
  RiStore3Fill,
  RiSunFill,
  RiTimeLine,
} from "react-icons/ri";
import {
  ImageMeeShowPngSwitch,
  ImageMeeThumbnail,
} from "~/components/layout/ImageMee";
import MoreButton from "../components/svg/button/MoreButton";
import { getYear } from "~/components/functions/DateFunction";
import { findMee, setWhere } from "~/data/find/findMee";
import { useHotkeys } from "react-hotkeys-hook";
import { ContentsTagsSelect } from "~/components/dropdown/SortFilterReactSelect";
import useWindowSize from "~/components/hook/useWindowSize";
import { useImageViewer } from "~/components/layout/ImageViewer";
import {
  ImagesUploadWithToast,
  SwitchNotDraftUpload,
  SwitchNoUploadThumbnail,
  SwitchUploadWebp,
  useImageEditSwitchHold,
  useImageNotDraftUpload,
  useNoUploadThumbnail,
  useUploadWebp,
} from "~/components/layout/edit/ImageEditForm";
import { useIsLogin } from "~/components/state/EnvState";
import { apiOrigin, imageDataIndexed } from "~/data/ClientDBLoader";
import { useCharacters } from "~/components/state/CharacterState";
import { callReactSelectTheme } from "~/components/define/callReactSelectTheme";
import { BiPhotoAlbum } from "react-icons/bi";
import { charaTagsLabel } from "~/components/FormatOptionLabel";
import {
  ModeSearchSwitch,
  ModeSwitch,
} from "~/components/layout/edit/CommonSwitch";
import { AiFillEdit } from "react-icons/ai";
import {
  DropdownButton,
  IconsFoldButton,
} from "~/components/dropdown/DropdownButton";
import {
  CompatGalleryButton as CGB,
  CompatMendingThumbnailButton,
  GalleryImportButton,
  GalleryUploadButton,
  ThumbnailResetButton,
} from "./edit/ImagesManager";
import { Modal } from "~/components/layout/Modal";
import { ObjectIndexedDBDownloadButton } from "~/components/button/ObjectDownloadButton";
import { TbDatabaseImport } from "react-icons/tb";
import { Md3dRotation, MdInsertDriveFile, MdMoveToInbox } from "react-icons/md";
import { ArrayEnv } from "~/Env";
import {
  useLikeState,
  useLikeStateUpdated,
} from "~/components/state/LikeState";
import { CreateObjectState } from "~/components/state/CreateState";
import { useLang } from "~/components/multilingual/LangState";
import {
  CountToContentsTagsOption,
  CustomReactSelect,
} from "~/components/dropdown/CustomReactSelect";
import { IndexedDataLastmodMH } from "~/data/IndexedDB/IndexedDataLastmodMH";
import { getCountList } from "~/components/functions/arrayFunction";

interface GalleryPageProps extends GalleryBodyOptions {
  children?: ReactNode;
  showAll?: boolean;
}
export function GalleryPage({ children, ...args }: GalleryPageProps) {
  const { galleryAlbums } = useImageState();
  return (
    <div className="galleryPage">
      {children}
      <GalleryObjectConvert items={galleryAlbums} {...args} />
    </div>
  );
}

export function GalleryGroupPageRoot({}: SearchAreaOptionsProps) {
  return <GalleryGroupPage />;
}

function GalleryGroupPage() {
  const { group } = useParams();
  const { imageAlbums } = useImageState();
  const album = useMemo(() => {
    if (group) {
      return (
        ArrayEnv.IMAGE_ALBUMS?.find(
          (album) => (typeof album === "string" ? album : album.name) === group
        ) || imageAlbums?.get(group)
      );
    } else return {} as KeyValueAnyType;
  }, [group, imageAlbums]);
  const items = album ? { ...album?.gallery?.generate, ...album } : undefined;
  return (
    <>
      <GalleryObjectConvert
        items={items}
        max={40}
        step={28}
        linkLabel={false}
        hideWhenEmpty={false}
      />
    </>
  );
}

export function GalleryObjectConvert({
  items,
  submitPreventScrollReset,
  ...args
}: GalleryObjectConvertProps) {
  const { images, imageAlbums } = useImageState();
  const [pickupList, setPickupList] = useState<ImageType[]>([]);
  const [topImageList, setTopImageList] = useState<ImageType[]>([]);
  useEffect(() => {
    if (images) {
      setPickupList(filterPickFixed({ images, name: "pickup" }));
      setTopImageList(filterPickFixed({ images, name: "topImage" }));
    }
  }, [images]);
  const convertItemArrayType = useCallback(
    (items?: GalleryItemsType) =>
      items ? (Array.isArray(items) ? items : [items]) : [],
    []
  );
  const convertItemObjectType = useCallback(
    (item: GalleryItemType) =>
      typeof item === "string" ? { name: item } : item,
    []
  );
  const albums = useMemo(
    () =>
      convertItemArrayType(items)
        .map((item) => convertItemObjectType(item))
        .map((item) => {
          if (!item.list) {
            const name = item.name;
            switch (name) {
              case "pickup":
              case "topImage":
                return {
                  ...item,
                  list: name === "pickup" ? pickupList : topImageList,
                  label: item.label ?? item.name,
                  max: item.max ?? 20,
                  linkLabel: item.linkLabel ?? false,
                  hideWhenFilter: true,
                  hideWhenEmpty: true,
                  notYearList: true,
                };
              default:
                const album = imageAlbums?.get(name);
                if (album) {
                  return {
                    ...item,
                    list: album.list,
                    label: item.label ?? album.name,
                    max: item.max ?? args.max ?? 20,
                    step: item.step ?? args.step,
                    linkLabel: item.linkLabel ?? args.linkLabel ?? true,
                    hideWhenEmpty: item.hideWhenEmpty ?? args.hideWhenEmpty,
                  };
                }
            }
          }
          return item;
        }),
    [items, pickupList, topImageList, imageAlbums]
  );

  return (
    <GalleryObject
      items={albums}
      submitPreventScrollReset={submitPreventScrollReset}
      {...args}
    />
  );
}

export const useGalleryObject = CreateObjectState<GalleryObjectType>({
  items: [],
  images: [],
  filteredGroups: [],
  filteredYearGroups: [],
});

export function GalleryObject({
  items: _items,
  hideWhenEmpty,
  ...args
}: GalleryObjectProps) {
  const searchParams = useSearchParams()[0];
  const sortParam = searchParams.get("sort");
  const typeParam = searchParams.get("type");
  const filterParam = searchParams.get("filter");
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const monthModeParam = (searchParams.get("monthMode") ||
    "time") as MonthSearchModeType;
  const qParam = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags")?.toLowerCase();
  const copyrightParam = searchParams.get("copyright");
  const viewModeParam = searchParams.get("viewMode");
  const charactersParam = searchParams.get("characters"?.toLowerCase());
  const { imageAlbums } = useImageState();
  const searchMode = useMemo(
    () => Boolean(qParam || tagsParam || copyrightParam || charactersParam),
    [qParam, tagsParam, copyrightParam, charactersParam]
  );
  const year = Number(yearParam);
  const filterMonthly = useCallback(
    (month: string | null) =>
      filterGalleryMonthList.find((v) => String(v.month) === month),
    [filterGalleryMonthList]
  );
  const whereMonthTags = useMemo(() => {
    if (monthParam) {
      switch (monthModeParam) {
        case "event":
          const monthly = filterMonthly(monthParam);
          if (monthly) return monthly.tags;
        case "tag":
          const _monthly = filterMonthly(monthParam);
          const monthTags = _monthly?.tags.find((v, i) => i === 0);
          if (monthTags) return [monthTags];
          break;
      }
    }
    return null;
  }, [monthModeParam, monthParam]);
  const isLogin = useIsLogin()[0];
  const showAllAlbum = searchParams.has("showAllAlbum");
  const topAlbum = searchParams.get("topAlbum");
  let items = useMemo(() => {
    const items = _items.concat();
    if (topAlbum) {
      topAlbum
        .split(",")
        .sort(() => -1)
        .forEach((name) => {
          const foundIndex = items.findIndex((item) => item.name === name);
          if (foundIndex >= 0) {
            const found = items.splice(foundIndex, 1)[0];
            items.unshift({ ...found, hide: false });
          } else {
            items.unshift({ name, hide: false });
          }
        });
      return items;
    } else return items;
  }, [_items, topAlbum]);
  items = useMemo(() => {
    if (isLogin && showAllAlbum)
      return items.map((item) => ({
        ...item,
        hideWhenEmpty: hideWhenEmpty,
        hide: false,
        linkLabel: true,
      }));
    else return items;
  }, [items, showAllAlbum, hideWhenEmpty, isLogin, imageAlbums]);
  const { Set } = useGalleryObject();

  const { where, orderBy } = useMemo(
    () =>
      setWhere<ImageType>(qParam, {
        text: {
          key: [
            "tags",
            "characters",
            "copyright",
            "title",
            "description",
            "embed",
            "characterNameGuides",
          ],
        },
        hashtag: { key: ["tags", "characters"], textKey: ["description"] },
      }),
    [qParam]
  );
  const whereTagsValue = useMemo(() => {
    const tags = tagsParam?.split(",");
    if (tags) return tags;
  }, [tagsParam]);
  const someTags = useMemo(() => {
    const tags: Array<string> = [];
  }, []);
  const someTagsWhere = useMemo(() => {
    const sometags: Array<string> = [];
    if (whereMonthTags) sometags.push(...whereMonthTags);
    if (sometags.length > 0) return { tags: { some: sometags } };
  }, [whereMonthTags]);
  const everyTagsWhere = useMemo(() => {
    const everytags: Array<string> = [];
    if (whereTagsValue) everytags.push(...whereTagsValue);
    if (everytags.length > 0) return { tags: { every: everytags } };
  }, [whereTagsValue]);
  const copyrightWhere = useMemo(() => {
    const list = copyrightParam?.split(",");
    if (list) return { copyright: { every: list } };
  }, [copyrightParam]);
  const charactersWhere = useMemo(() => {
    const list = charactersParam?.split(",");
    if (list) return { characters: { every: list } };
  }, [charactersParam]);
  const likeWhere = useMemo(() => filterParam === "like", [filterParam]);
  const linkStateUpdated = useLikeStateUpdated()[0];
  const draftOnly = useMemo(
    () => searchParams.has("draftOnly"),
    [searchParams]
  );
  const hasTopImage = useMemo(
    () => searchParams.has("topImage"),
    [searchParams]
  );
  const hasPickup = useMemo(() => searchParams.has("pickup"), [searchParams]);
  const wheres = useMemo(() => {
    const wheres = [where];
    if (someTagsWhere) wheres.push(someTagsWhere);
    if (everyTagsWhere) wheres.push(everyTagsWhere);
    if (copyrightWhere) wheres.push(copyrightWhere);
    if (charactersWhere) wheres.push(charactersWhere);
    if (hasTopImage) wheres.push({ topImage: { gte: 1 } });
    if (hasPickup) wheres.push({ pickup: true });
    if (likeWhere) wheres.push({ like: { checked: true } });
    if (typeParam) wheres.push({ type: typeParam });
    if (draftOnly) wheres.push({ draft: true });
    return wheres;
  }, [
    where,
    someTagsWhere,
    everyTagsWhere,
    copyrightWhere,
    charactersWhere,
    hasTopImage,
    hasPickup,
    likeWhere,
    typeParam,
    draftOnly,
  ]);
  const orderBySort = useMemo(() => {
    const list: OrderByItem<ImageType>[] = [...orderBy];
    const searchSort = sortParam ?? "";
    switch (searchSort) {
      case "recently":
        list.push({ time: "desc" });
        break;
      case "leastRecently":
        list.push({ time: "asc" });
        break;
      case "nameOrder":
        list.push({ title: "asc" });
        break;
      case "leastNameOrder":
        list.push({ title: "desc" });
        break;
      case "likeCount":
        list.push({ like: { count: "desc" } });
        break;
    }
    if (hasTopImage) list.push({ topImage: "desc" });
    const keys = list.reduce((a, c) => {
      Object.keys(c).forEach((v) => a.push(v));
      return a;
    }, [] as string[]);
    if (keys.every((key) => key !== "time")) list.unshift({ time: "desc" });
    if (keys.every((key) => key !== "key")) list.unshift({ key: "asc" });
    return list;
  }, [sortParam, orderBy, hasTopImage]);

  let filteredGroups = useMemo(() => {
    return items.map<GalleryItemObjectType>(({ list, ...group }) => {
      if (
        group.hide ||
        (!searchMode && group.hideWhenDefault) ||
        (group.hideWhenFilter &&
          (searchMode || typeParam || monthParam || hasPickup || hasTopImage))
      ) {
        return { list: [], ...group };
      } else {
        let images = list || [];
        if (monthModeParam === "time" && monthParam) {
          images = images.filter(({ time }) => {
            return time ? String(time.getMonth() + 1) === monthParam : false;
          });
        }
        images = findMee([...images], {
          where: { AND: wheres },
          orderBy: orderBySort,
        });
        return { list: images, ...group };
      }
    });
  }, [
    items,
    searchMode,
    monthModeParam,
    monthParam,
    wheres,
    orderBySort,
    hasPickup,
    hasTopImage,
    linkStateUpdated,
  ]);

  filteredGroups = useMemo(() => {
    if (viewModeParam === "mix") {
      return [
        filteredGroups.reduce<GalleryItemObjectType>(
          (a, c) => {
            if (c.name !== "pickup") {
              c.list?.forEach((item) => {
                a.list!.push(item);
              });
            }
            return a;
          },
          { name: "gallery", list: [] }
        ),
      ].map((v) => {
        v.list = findMee(v.list!, {
          orderBy: orderBySort,
        });
        return v;
      });
    } else return filteredGroups;
  }, [filteredGroups, viewModeParam, orderBySort]);

  const filteredYearGroups = useMemo(() => {
    return filteredGroups.map<GalleryItemObjectType>(({ list, ...item }) => {
      if (year && list)
        return {
          list: list.filter((item) => getYear(item.time) === year),
          ...item,
        };
      return { list, ...item };
    });
  }, [filteredGroups, year]);
  useLayoutEffect(() => {
    const images = filteredYearGroups.reduce<ImageType[]>((a, c) => {
      if (!c.notYearList) {
        c.list?.forEach((image) => {
          a.push(image);
        });
      }
      return a;
    }, []);
    Set({ filteredGroups, filteredYearGroups, images });
  }, [filteredGroups, filteredYearGroups]);
  useLayoutEffect(() => {
    Set({ items });
  }, [items]);
  const yfList = useMemo(
    () => filteredYearGroups.map<ImageType[]>(({ list }) => list || []),
    [filteredYearGroups]
  );
  return (
    <>
      <GalleryBody items={filteredGroups} yfList={yfList} {...args} />
    </>
  );
}

function UploadChain({
  className,
  item,
  children,
  enableOnClick,
}: {
  className?: string;
  item?: GalleryItemObjectType;
  children?: ReactNode;
  enableOnClick?: boolean;
}) {
  const character = useParams().charaName;
  const webp = useUploadWebp()[0];
  const thumbnail = !useNoUploadThumbnail()[0];
  const notDraft = useImageNotDraftUpload()[0];
  const searchParams = useSearchParams()[0];
  const qParam = searchParams.get("q");
  const tagsParam = searchParams.get("tags");
  const monthParam = searchParams.get("month");
  const tags = useMemo(() => {
    let tags: string[] = [];
    if (item?.tags) tags = tags.concat(item.tags);
    if (tagsParam) tags = tags.concat(tagsParam);
    if (monthParam) {
      const monthTag = MonthToTag(Number(monthParam));
      if (monthTag) tags = tags.concat(monthTag);
    }
    const hashtags = qParam
      ?.split(" OR ")[0]
      .split(" ")
      .filter((v) => v.startsWith("#"))
      .map((v) => v.slice(1));
    if (hashtags) tags = tags.concat(hashtags);
    return tags;
  }, [item, tagsParam, qParam]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const now = new Date();
      const nowTime = now.getTime();
      const list = acceptedFiles.filter(
        (f) => Math.abs(nowTime - f.lastModified) > 10
      );
      await ImagesUploadWithToast({
        src: list,
        character,
        webp,
        thumbnail,
        notDraft,
        tags,
        ...(item
          ? {
              album: item.name,
              character: item.character,
            }
          : undefined),
      }).then(() => {
        imageDataIndexed.load("no-cache");
      });
    },
    [item, character, apiOrigin, webp, thumbnail, notDraft, tags]
  );
  const { getRootProps, getInputProps, isDragAccept } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    noClick: typeof enableOnClick === "boolean" ? !enableOnClick : true,
  });
  const classNameMemo = useMemo(() => {
    const list = ["dropzone"];
    if (className) list.push(className);
    if (isDragAccept) list.push("isDrag");
    if (enableOnClick) list.push("cursor-pointer");
    return list.join(" ");
  }, [className, isDragAccept, enableOnClick]);
  return (
    <>
      <div {...getRootProps()} className={classNameMemo}>
        <input
          name="upload"
          id={item ? "upload_" + item.name : undefined}
          {...getInputProps()}
        />
        {children}
      </div>
    </>
  );
}

interface GalleryBodyProps extends GalleryBodyOptions {
  items: GalleryItemObjectType[];
  yfList: ImageType[][];
}
function GalleryBody({
  items,
  yfList,
  showInPageMenu = true,
  showGalleryHeader = true,
  showGalleryLabel = true,
  showCount = true,
  submitPreventScrollReset,
}: GalleryBodyProps) {
  const search = useSearchParams()[0];
  const getSearchParamMap = useCallback(
    (key: string) =>
      (search.get(key) || "").split(",").reduce<Map<string, void>>((a, c) => {
        a.set(c);
        return a;
      }, new Map()),
    [search]
  );
  const tagsParam = useMemo(() => getSearchParamMap("tags"), [search]);
  const copyrightParam = useMemo(
    () => getSearchParamMap("copyright"),
    [search]
  );
  const typeParam = useMemo(() => search.get("type"), [search]);
  const filterParam = useMemo(() => getSearchParamMap("filter"), [search]);
  const nav = useNavigate();
  const { group } = useParams();
  const args = {
    showInPageMenu,
    showGalleryHeader,
    showGalleryLabel,
    showCount,
  };
  const isLogin = useIsLogin()[0];
  const refList = items?.map(() => createRef<HTMLDivElement>()) ?? [];
  const images = useMemo(
    () =>
      items
        .map((group, i) => {
          return {
            images: yfList[i],
            flag: !group.hide && group.name !== "pickup" && group.list,
          };
        })
        .reduce<ImageType[]>((a, { images, flag }) => {
          if (flag) {
            images.forEach((image) => {
              a.push(image);
            });
          }
          return a;
        }, []),
    [items, yfList]
  );
  const { likeCategoryMap } = useLikeState();
  const likeCheckedMap = useMemo(() => {
    const imageLikeMap = likeCategoryMap?.get("image");
    if (imageLikeMap) {
      const likedList = findMee(Array.from(imageLikeMap.values()), {
        where: { checked: true },
      });
      return likedList.reduce<Map<string, LikeType>>((a, c) => {
        if (c.path?.startsWith("?")) {
          const params = new URLSearchParams(c.path);
          const key = params.get("image");
          if (key) a.set(key, c);
        }
        return a;
      }, new Map());
    }
  }, [likeCategoryMap]);

  const tagsList = useMemo(
    () => getCountList(images, "tags").sort((a, b) => b.count - a.count),
    [images]
  );
  const copyrightList = useMemo(
    () => getCountList(images, "copyright").sort((a, b) => b.count - a.count),
    [images]
  );
  const typeMap = useMemo(
    () =>
      getCountList(images, "type").reduce<Map<string, ValueCountType>>(
        (a, c) => {
          a.set(c.value, c);
          return a;
        },
        new Map()
      ),
    [images]
  );
  const likedCountValue = useMemo<ValueCountType>(
    () => ({
      value: "liked",
      count: images.filter((image) => likeCheckedMap?.has(image.key)).length,
    }),
    [images, likeCheckedMap]
  );
  const callbackOptions = useCallback(
    (options: ContentsTagsOption[]) => {
      const cloneTagsParam = new Map(tagsParam);
      const otherTags = tagsList.filter(({ value: tag }) =>
        simpleDefaultTags.every(({ value }) => value !== tag)
      );
      const defaultTagsMap = new Map(
        tagsList
          .filter(({ value }) =>
            otherTags.every(({ value: ov }) => value !== ov)
          )
          .map((v) => [v.value, v])
      );
      function defaultReplace(
        options: ContentsTagsOption[],
        parent?: ContentsTagsOption
      ): ContentsTagsOption[] {
        return options
          .map((option) => {
            if (option.options) {
              option = { ...option };
              option.options = defaultReplace(option.options!, option);
            } else if (option.value) {
              option = { ...option };
              if (parent?.name === "type") {
                const name = option.value!.replace("type:", "");
                option.name = name;
                const type = typeMap.get(name);
                if (type) {
                  option.valueCount = type;
                  option.label = `${option.label} (${type.count})`;
                }
              } else if (option.name === "liked") {
                if (likedCountValue.count) {
                  option.label = `${option.label} (${likedCountValue.count})`;
                  option.valueCount = likedCountValue;
                }
              } else {
                const tag = defaultTagsMap.get(option.value!);
                if (tag) {
                  option.valueCount = tag;
                  option.label = `${option.label} (${tag.count})`;
                }
              }
            }
            return option;
          })
          .filter((option) => {
            if (option.value) {
              if (cloneTagsParam.has(option.value)) {
                cloneTagsParam.delete(option.value);
                return true;
              }
            }
            if (option.name === "liked" && filterParam.has("like")) return true;
            if (parent?.name === "type" && typeParam === option.name)
              return true;
            if (option.options || option.valueCount) return true;
            switch (option.name) {
              case "showAll":
                return true;
            }
            switch (parent?.name) {
              case "sort":
              case "monthly":
                return true;
            }
          });
      }
      options = defaultReplace(options);
      const otherTagsOptions = CountToContentsTagsOption(otherTags);
      otherTags.forEach((v) => {
        if (v.value && cloneTagsParam.has(v.value))
          cloneTagsParam.delete(v.value);
      });
      cloneTagsParam.forEach((v, k) => {
        if (k) otherTagsOptions.push({ value: k, label: k });
      });
      if (otherTagsOptions.length > 0)
        options.push({
          label: "タグ",
          options: otherTagsOptions,
        });
      const copyrightOptions = CountToContentsTagsOption(
        copyrightList,
        "copyright"
      );
      const cloneCopyrightParam = new Map(copyrightParam);
      copyrightList.forEach((v) => {
        if (v.value && cloneCopyrightParam.has(v.value))
          cloneCopyrightParam.delete(v.value);
      });
      cloneCopyrightParam.forEach((v, k) => {
        if (k) copyrightOptions.push({ value: `copyright:${k}`, label: k });
      });
      if (copyrightOptions.length > 0)
        options.push({
          label: "コピーライト",
          options: copyrightOptions,
        });
      return options;
    },
    [
      tagsList,
      copyrightList,
      typeMap,
      likedCountValue,
      tagsParam,
      copyrightParam,
      typeParam,
      filterParam,
    ]
  );
  const inPageList = useMemo(
    () =>
      yfList
        .map((_, i) => items[i])
        .map(({ label, name }, i) => ({
          name: label || name || "",
          ref: refList[i],
        })),
    [yfList, items]
  );
  const galleryItem = items
    .map((item, i) => ({ ...item, i }))
    .filter(({ hideWhenEmpty = true, i }) =>
      hideWhenEmpty ? yfList[i].length : true
    )
    .map(({ i, ...item }) => (
      <div key={i}>
        {isLogin ? (
          <UploadChain item={item}>
            <GalleryContent
              ref={refList[i]}
              list={yfList[i]}
              item={item}
              {...args}
            />
          </UploadChain>
        ) : (
          <GalleryContent
            ref={refList[i]}
            list={yfList[i]}
            item={item}
            {...args}
          />
        )}
      </div>
    ));
  const SearchAreaOptions = { submitPreventScrollReset };
  return (
    <div className="galleryContainer">
      {showInPageMenu && !group ? (
        <InPageMenu list={inPageList} adjust={64} />
      ) : null}
      <div>
        {showGalleryHeader ? (
          <div>
            <div className="header">
              <GalleryYearFilter {...SearchAreaOptions} />
              <GallerySearchArea {...SearchAreaOptions} />
              <div className="flex">
                <GalleryCharactersSelect
                  {...SearchAreaOptions}
                  className="flex-1"
                />
                <GalleryTagsSelect
                  {...SearchAreaOptions}
                  callbackOptions={callbackOptions}
                  className="flex-1"
                />
              </div>
            </div>
            {isLogin ? (
              <div className="icons flex center">
                <DropdownButton
                  classNames={{
                    dropMenuButton: "iconSwitch",
                    dropItemList: "flex column font-small",
                  }}
                >
                  <ObjectIndexedDBDownloadButton
                    className="squared item"
                    indexedDB={imageDataIndexed}
                  >
                    ギャラリーJSONデータのダウンロード
                  </ObjectIndexedDBDownloadButton>
                  <GalleryImportButton
                    icon={<TbDatabaseImport />}
                    className="squared item"
                    overwrite={false}
                  >
                    ギャラリーJSONデータのインポート
                  </GalleryImportButton>
                  <GalleryImportButton
                    icon={<TbDatabaseImport />}
                    className="squared item"
                    overwrite={true}
                  >
                    ギャラリーJSONデータの上書きインポート
                  </GalleryImportButton>
                  <ThumbnailResetButton className="squared item" />
                  <CompatMendingThumbnailButton className="squared item" />
                  {/* <CGB from="art" to="main" className="squared item" /> */}
                </DropdownButton>
                <IconsFoldButton
                  title="絞り込み"
                  MenuButton={<RiMenuSearchLine />}
                >
                  <ModeSearchSwitch
                    toEnableTitle="トップ画像が有効なものを絞り込む"
                    toDisableTitle="トップ画像から元の表示に戻す"
                    searchKey="topImage"
                  >
                    <RiHomeGearLine />
                  </ModeSearchSwitch>
                  <ModeSearchSwitch
                    toEnableTitle="ピックアップが有効なものを絞り込む"
                    toDisableTitle="ピックアップから元の表示に戻す"
                    searchKey="pickup"
                  >
                    <RiPushpin2Line />
                  </ModeSearchSwitch>
                  <ModeSearchSwitch
                    toEnableTitle="下書きのみ表示"
                    toDisableTitle="下書き以外も表示"
                    searchKey="draftOnly"
                  >
                    <RiChatPrivateLine />
                  </ModeSearchSwitch>
                </IconsFoldButton>
                <ImageMeeShowPngSwitch />
                <ModeSearchSwitch
                  toEnableTitle={
                    "全てのアルバムを表示する\n（右クリックで任意のアルバム名へ飛ぶ）"
                  }
                  toDisableTitle={
                    "アルバム表示を元に戻す\n（右クリックで任意のアルバム名へ飛ぶ）"
                  }
                  searchKey="showAllAlbum"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const group = prompt("任意のアルバム名");
                    if (group) {
                      nav({ pathname: "/gallery/" + group });
                    }
                  }}
                >
                  <BiPhotoAlbum />
                </ModeSearchSwitch>
                <ModeSwitch
                  toEnableTitle="常に編集モードにする"
                  useSwitch={useImageEditSwitchHold}
                >
                  <AiFillEdit />
                </ModeSwitch>
                <SwitchNotDraftUpload />
                <SwitchNoUploadThumbnail />
                <SwitchUploadWebp />
                <GalleryUploadButton className="iconSwitch" group={group} />
              </div>
            ) : null}
          </div>
        ) : null}
        {galleryItem.length > 0 ? (
          galleryItem
        ) : isLogin ? (
          <UploadChain className="blank" enableOnClick={true}>
            ここにドロップするとファイルをアップロードできます！
          </UploadChain>
        ) : null}
      </div>
    </div>
  );
}

function GalleryImageItem({
  galleryName,
  image,
  onClick,
}: {
  galleryName?: string;
  image: ImageType;
  onClick?: (image: ImageType) => void;
}) {
  const { pathname, hash } = useLocation();
  const visibleImage = useMemo(() => hash !== "#laymic", [hash]);
  const [searchParams] = useSearchParams();
  const toStatehandler = useCallback((): {
    to: To;
    state?: any;
    preventScrollReset?: boolean;
    title?: string;
  } => {
    if (image.direct) return { to: image.src ?? "" };
    searchParams.set("image", image.key);
    if (galleryName && image.albumObject?.name !== galleryName)
      searchParams.set("group", galleryName);
    else if (image.albumObject?.name)
      searchParams.set("album", image.albumObject.name);
    return {
      to: new URL("?" + searchParams.toString(), location.href).href,
      state: { from: pathname, keep: true },
      preventScrollReset: true,
      title: image.title || undefined,
    };
  }, [searchParams, image]);
  const ImageTimeFrameTag = useMemo(() => {
    return TimeframeTags.find((tt) =>
      image.tags?.some((tag) => tt.value === tag)
    )?.value;
  }, [image]);
  const Item = useMemo(() => {
    return (
      <Link
        className="item"
        {...toStatehandler()}
        onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          if (onClick) {
            e.preventDefault();
            onClick(image);
          }
        }}
      >
        {visibleImage ? (
          <>
            <GalleryItemRibbon image={image} />
            {image.type === "ebook" || image.type === "goods" ? (
              image.embed ? (
                <div className="translucent-special-button">
                  <RiBook2Fill />
                </div>
              ) : image.link ? (
                <div className="translucent-special-button">
                  <RiStore3Fill />
                </div>
              ) : null
            ) : image.type === "movie" ? (
              <div className="translucent-special-button">
                <RiPlayLargeFill />
              </div>
            ) : image.type === "3d" && (image.embed || image.link) ? (
              <div className="translucent-special-button">
                <Md3dRotation />
              </div>
            ) : image.embed ? (
              <div className="translucent-special-button">
                {image.type === "material" ? (
                  <MdMoveToInbox />
                ) : image.type === "pdf" ? (
                  <RiFilePdf2Fill />
                ) : (
                  <MdInsertDriveFile />
                )}
              </div>
            ) : (image.topImage || 0) > 3 && ImageTimeFrameTag ? (
              <div className="translucent-special-button">
                {ImageTimeFrameTag === "morning" ? (
                  <RiHazeFill />
                ) : ImageTimeFrameTag === "forenoon" ? (
                  <RiLandscapeFill />
                ) : ImageTimeFrameTag === "midday" ? (
                  <RiSunFill />
                ) : ImageTimeFrameTag === "afternoon" ? (
                  <RiCupFill />
                ) : ImageTimeFrameTag === "evening" ? (
                  <RiKeynoteFill />
                ) : ImageTimeFrameTag === "night" ? (
                  <RiMoonFill />
                ) : ImageTimeFrameTag === "midnight" ? (
                  <RiMoonFoggyFill />
                ) : (
                  <RiTimeLine />
                )}
              </div>
            ) : null}
            <ImageMeeThumbnail
              imageItem={image}
              loadingScreen={true}
              showMessage={true}
            />
          </>
        ) : null}
      </Link>
    );
  }, [
    image,
    galleryName,
    onClick,
    toStatehandler,
    ImageTimeFrameTag,
    visibleImage,
  ]);
  return Item;
}

interface GalleryContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    GalleryBodyOptions {
  item: GalleryItemObjectType;
  list: ImageType[];
  ref?: React.RefObject<HTMLDivElement | null>;
}
function GalleryContent({ item, ...args }: GalleryContentProps) {
  const { state } = useLocation();
  const curMaxStateName = useMemo(() => "galleryMax-" + item.name, [item.name]);
  const max = state?.[curMaxStateName];
  const Main = useMemo(
    () => (
      <GalleryContentMain
        item={item}
        stateMax={max}
        curMaxStateName={curMaxStateName}
        {...args}
      />
    ),
    [item, curMaxStateName, args]
  );
  return Main;
}
interface GalleryContentMainProps extends GalleryContentProps {
  stateMax?: number;
  curMaxStateName: string;
}
function GalleryContentMain({
  item,
  list,
  className,
  showGalleryLabel,
  showCount,
  showGalleryHeader,
  showInPageMenu,
  ref,
  stateMax,
  curMaxStateName,
  ...args
}: GalleryContentMainProps) {
  let {
    name,
    linkLabel,
    h2,
    h4,
    label,
    step = 20,
    max: maxFromArgs = 20,
    maxWhenSearch = 40,
  } = item;
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q");
  const tags = searchParams.get("tags");
  const characters = searchParams.get("characters");
  const searchMode = useMemo(
    () => Boolean(q || tags || characters),
    [q, tags, characters]
  );
  const [w] = useWindowSize();
  const max = useMemo(
    () => (searchMode ? maxWhenSearch : maxFromArgs),
    [maxFromArgs, maxWhenSearch, searchMode]
  );
  const [curMaxState, setCurMax] = useState(stateMax ?? max);
  const befCurMax = useRef(curMaxState);
  useEffect(() => {
    if (befCurMax.current !== curMaxState) {
      nav(location, {
        state: { keep: true, [curMaxStateName]: curMaxState },
        replace: true,
        preventScrollReset: true,
      });
      befCurMax.current = curMaxState;
    }
  }, [curMaxState, curMaxStateName]);
  const curMax = useMemo(() => {
    let curMax = curMaxState;
    if (w >= 768) curMax = Math.ceil(curMax / 5) * 5;
    else curMax = Math.ceil(curMax / 4) * 4;
    return curMax;
  }, [curMaxState, w]);
  const labelString = useMemo(() => label || name, [name, label]);
  const nav = useNavigate();
  const { Set } = useSelectImageState();
  const isModal = useMemo(
    () => searchParams.get("modal") === "gallery",
    [searchParams]
  );
  const imageOnClick = isModal
    ? function (image: ImageType) {
        Set({ image });
      }
    : undefined;
  const showMoreButton = curMax < (list.length || 0);
  const visibleMax = showMoreButton ? curMax - 1 : curMax;
  const HeadingElm = useCallback(
    ({ label }: { label?: string }) =>
      label && linkLabel ? (
        <Link
          to={
            new URL(
              typeof linkLabel === "string" ? linkLabel : "/gallery/" + name,
              location.href
            ).href
          }
        >
          {label}
        </Link>
      ) : (
        <>{label}</>
      ),
    [linkLabel, name]
  );
  const GalleryLabel = useMemo(
    () =>
      showGalleryLabel ? (
        <div className="galleryLabel">
          <h2 className="en-title-font">
            <HeadingElm label={labelString} />
          </h2>
          {showCount ? <div className="count">({list.length})</div> : null}
        </div>
      ) : null,
    [showGalleryLabel, labelString, list.length, showCount]
  );
  const listClassName = useMemo(() => {
    const classes = ["galleryList"];
    switch (item.type) {
      case "banner":
        classes.push("banner");
        break;
      default:
        classes.push("grid");
        break;
    }
    return classes.join(" ");
  }, [item]);
  const ShowMore = useCallback(() => {
    const max = curMax + step;
    setCurMax(max);
  }, [curMax, name, step]);
  const _className = useMemo(() => {
    const list = ["galleryContainer"];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  return (
    <div {...args} ref={ref} className={_className}>
      {h2 || h4 ? (
        <div className="galleryLabel outLabel">
          {h2 ? <h2>{h2}</h2> : null}
          {h4 ? <h4>{h4}</h4> : null}
        </div>
      ) : null}
      {GalleryLabel}
      <div className={listClassName}>
        {list
          .filter((_, i) => i < visibleMax)
          .map((image, i) => (
            <GalleryImageItem
              image={image}
              galleryName={name}
              onClick={imageOnClick}
              key={image.key}
            />
          ))}
        {showMoreButton ? (
          <a
            onClick={(e) => {
              e.preventDefault();
              ShowMore();
            }}
            title="もっと見る"
            className="item"
          >
            <MoreButton className="gallery-button-more" />
          </a>
        ) : null}
      </div>
      {/* <div className="loadingNow text-main-soft my-4">よみこみちゅう…</div> */}
    </div>
  );
}

export function GalleryYearFilter({
  submitPreventScrollReset = true,
}: SearchAreaOptionsProps) {
  const { filteredGroups } = useGalleryObject();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = Number(searchParams.get("year") ?? NaN);
  const isOlder = searchParams.get("sort") === "leastRecently";
  const yearSelectRef = React.useRef<HTMLSelectElement>(null);
  const yearListBase = useMemo(
    () =>
      getYearObjects(
        filteredGroups
          .filter((item) => !item.notYearList)
          .reduce((a, c) => {
            (c.list || []).forEach(({ time }) => {
              if (time) a.push(time);
            });
            return a;
          }, [] as Date[])
      ),
    [filteredGroups]
  );
  const yearListBase2 = useMemo(() => {
    const addedList =
      isNaN(year) || !yearListBase.every((y) => y.year !== year)
        ? yearListBase
        : yearListBase.concat({ year, count: 0 });
    addedList.forEach((y) => {
      y.label = `${y.year} (${y.count})`;
      y.value = String(y.year);
    });
    return addedList.concat();
  }, [yearListBase, year]);
  const yearList = useMemo(() => {
    const olderSign = isOlder ? 1 : -1;
    const sortedList = yearListBase2
      .concat()
      .sort((a, b) => olderSign * (a.year - b.year));
    const count = sortedList.reduce((a, c) => a + c.count, 0);
    sortedList.unshift({
      year: 0,
      count,
      label: `Year (${count})`,
      value: "",
    });
    return sortedList;
  }, [yearListBase2, isOlder]);
  const changeHandler = useCallback(() => {
    if (yearSelectRef.current) {
      const yearSelect = yearSelectRef.current;
      if (yearSelect.value) searchParams.set("year", yearSelect.value);
      else searchParams.delete("year");
      setSearchParams(searchParams, {
        preventScrollReset: submitPreventScrollReset,
      });
    }
  }, [yearSelectRef, searchParams]);
  return (
    <select
      title="年フィルタ"
      className="noBorder year"
      ref={yearSelectRef}
      value={year || ""}
      onChange={changeHandler}
    >
      {yearList.map(({ value, label }, i) => (
        <option key={i} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

interface SearchAreaProps
  extends React.HTMLAttributes<HTMLFormElement>,
    SearchAreaOptionsProps {}

export function GallerySearchArea({
  className,
  submitPreventScrollReset = true,
  ...args
}: SearchAreaProps) {
  className = className ? ` ${className}` : "";
  const { isOpen } = useImageViewer();
  const searchRef = React.useRef<HTMLInputElement>(null);
  useHotkeys("slash", (e) => {
    if (!isOpen) {
      searchRef.current?.focus();
      e.preventDefault();
    }
  });
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === searchRef.current) {
        searchRef.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT"] }
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const isModal = searchParams.has("modal");
  useEffect(() => {
    if (searchRef.current) {
      const q = searchParams.get("q") ?? "";
      searchRef.current.value = q;
    }
  }, [searchParams]);
  const submitHandler = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      if (searchRef.current) {
        const q = searchRef.current.value;
        if (q) searchParams.set("q", q);
        else searchParams.delete("q");
        setSearchParams(searchParams, {
          preventScrollReset: submitPreventScrollReset,
          replace: isModal,
          state: { keep: true },
        });
        (document.activeElement as HTMLElement).blur();
        e?.preventDefault();
      }
    },
    [searchParams]
  );
  return (
    <form className={className} {...args} onSubmit={submitHandler}>
      <input
        name="q"
        type="search"
        placeholder="ギャラリー検索"
        ref={searchRef}
        className="search"
      />
    </form>
  );
}

function getYearObjects(dates: (Date | null | undefined)[]) {
  return dates
    .map((date) => getYear(date))
    .reduce((a, c) => {
      const g = a.find(({ year }) => c === year);
      if (g) g.count++;
      else if (c) a.push({ year: c, count: 1 });
      return a;
    }, [] as YearListType[])
    .sort((a, b) => b.year - a.year);
}

interface SelectAreaProps extends SearchAreaOptionsProps {
  className?: string;
  addOptions?: ContentsTagsOption[];
  callbackOptions?(options: ContentsTagsOption[]): ContentsTagsOption[];
}

const gallerySortTags = [
  defineSortTags([
    "leastResently",
    "nameOrder",
    "leastNameOrder",
    "likeCount",
    "mix",
  ]),
];
export function GalleryTagsSelect({
  addOptions,
  callbackOptions,
  ...args
}: SelectAreaProps) {
  const isLogin = useIsLogin()[0];
  const tags = useMemo(() => {
    const options: ContentsTagsOption[] = [
      ...gallerySortTags,
      ...(isLogin ? addExtentionTagsOptions() : defaultGalleryTags),
      ...(addOptions ? addOptions : []),
    ];
    if (callbackOptions) return callbackOptions(options);
    else return options;
  }, [isLogin, addOptions, callbackOptions]);
  return <ContentsTagsSelect {...args} tags={tags} />;
}
export function GalleryCharactersSelect({
  submitPreventScrollReset,
  className,
}: SelectAreaProps) {
  const params = useParams();
  const lang = useLang()[0];
  const [searchParams, setSearchParams] = useSearchParams();
  const isModal = searchParams.has("modal");
  const currentChara = params["charaName"];
  const enableCharaFilter = Boolean(currentChara && !isModal);
  const { characters, charactersMap } = useCharacters();
  const charaLabelOptions = useMemo(() => {
    let list = characters ?? [];
    if (enableCharaFilter) list = list.filter((v) => v.key !== currentChara!);
    return list.map<ContentsTagsOptionMustValue>((chara) => ({
      value: chara.key,
      nameGuide:
        chara.name +
        (chara.honorific || "") +
        (chara.enName ? "," + chara.enName : "") +
        (chara.nameGuide ? "," + chara.nameGuide : ""),
    }));
  }, [characters, currentChara, enableCharaFilter]);
  const value = useMemo(() => {
    const list = searchParams.get("characters")?.split(",");
    return charaLabelOptions.filter(({ value }) =>
      list?.some((item) => item === value)
    );
  }, [searchParams, charaLabelOptions]);
  const charaFormatOptionLabel = useMemo(() => {
    if (charactersMap) return charaTagsLabel(charactersMap, lang);
  }, [charactersMap, lang]);
  return (
    <CustomReactSelect
      options={charaLabelOptions}
      formatOptionLabel={charaFormatOptionLabel}
      isMulti
      isLoading={!Boolean(characters)}
      classNamePrefix="select"
      placeholder={(enableCharaFilter ? "他の" : "") + "キャラクター"}
      instanceId="characterSelect"
      className={"characterSelect" + (className ? " " + className : "")}
      theme={callReactSelectTheme}
      styles={{
        menuList: (style) => ({ ...style, minHeight: "22rem" }),
        menu: (style) => ({ ...style, zIndex: 9999 }),
      }}
      value={value}
      onChange={(v) => {
        const value = v.map(({ value }) => value).join(",");
        if (value) searchParams.set("characters", value);
        else searchParams.delete("characters");
        setSearchParams(searchParams, {
          preventScrollReset: true,
          replace: isModal,
          state: { keep: true },
        });
      }}
    />
  );
}

function GalleryItemRibbon({ image }: { image: ImageType }) {
  const schedule =
    image.schedule && image.lastmod && image.lastmod.getTime() > Date.now();
  const className = useMemo(() => {
    const list = ["ribbon"];
    if (image.draft) list.push("draft");
    else if (schedule) list.push("schedule");
    else if (image.update) {
      if (image.new) list.push("new");
      else list.push("update");
    }
    return list.join(" ");
  }, [image.update, image.new, image.draft, schedule]);
  return (
    <>
      {image.draft ? (
        <div className={className}>Draft</div>
      ) : schedule ? (
        <div className={className}>Schedule</div>
      ) : image.update ? (
        <div className={className}>{image.new ? "New!" : "Update"}</div>
      ) : null}
    </>
  );
}

export function MiniGallery() {
  const { Set, image, _openArgs } = useSelectImageState();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  let { state } = useLocation();
  useEffect(() => {
    if (_openArgs) {
      if (!state) state = {};
      state.from = location.href;
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("modal", "gallery");
      if (_openArgs.showAll) newSearchParams.set("showAllAlbum", "on");
      if (_openArgs.topAlbum)
        newSearchParams.set("topAlbum", _openArgs.topAlbum);
      if (_openArgs.query) {
        const entry = Object.entries(_openArgs.query);
        entry.forEach(([k, v]) => {
          if (v) newSearchParams.set(k, v);
        });
      }
      setSearchParams(Object.fromEntries(newSearchParams), {
        state,
        preventScrollReset: true,
      });
      Set({ _openArgs: null, id: _openArgs.id });
    }
  }, [_openArgs, state, searchParams]);
  const enable = useMemo(
    () => searchParams.get("modal") === "gallery",
    [searchParams]
  );
  const closeHandler = useCallback(() => {
    Set({ image: null, id: "" });
    if (state?.from) {
      delete state.from;
      nav(-1);
    } else {
      searchParams.delete("modal");
      setSearchParams(searchParams, { state, preventScrollReset: true });
    }
  }, [state, searchParams]);
  useEffect(() => {
    if (image) closeHandler();
  }, [image]);
  return (
    <>
      <Modal
        classNameEntire="gallery"
        className="large"
        onClose={closeHandler}
        isOpen={enable}
        scroll
        timeout={50}
      >
        <GalleryPage showInPageMenu={false} hideWhenEmpty={true} />
      </Modal>
    </>
  );
}
