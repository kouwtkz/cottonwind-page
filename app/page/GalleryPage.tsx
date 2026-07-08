import {
  Link,
  type To,
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
import {
  apiOrigin,
  imageDataIndexed,
  linksDataIndexed,
} from "~/data/ClientDBLoader";
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
import { CreateObjectState, CreateState } from "~/components/state/CreateState";
import { useLang } from "~/components/multilingual/LangState";
import {
  CountToContentsTagsOption,
  CustomReactSelect,
} from "~/components/dropdown/CustomReactSelect";
import { getCountList } from "~/components/functions/arrayFunction";
import { EditableLinksContainer } from "./LinksPage";
import { useLinks } from "~/components/state/LinksState";
import { getSearchParamMap } from "~/components/functions/doc/SetSearchParams";
import { PiImagesFill } from "react-icons/pi";
import { TimeClass } from "~/components/functions/Time";

interface GalleryPageRootProps {
  isGroup?: boolean;
}
export function GalleryPageRoot({ isGroup }: GalleryPageRootProps) {
  return useMemo(
    () => (isGroup ? <GalleryGroupPage /> : <GalleryPage />),
    [isGroup],
  );
}
export function GalleryPage(args: GalleryPageOptions) {
  const { galleryAlbums } = useImageState();
  return (
    <div className="galleryPage">
      <GalleryObjectConvert items={galleryAlbums} {...args} />
    </div>
  );
}

function GalleryGroupPage() {
  const { group } = useParams();
  const { imageAlbums } = useImageState();
  const album = useMemo(() => {
    if (group) {
      return (
        ArrayEnv.IMAGE_ALBUMS?.find(
          (album) => (typeof album === "string" ? album : album.name) === group,
        ) || imageAlbums?.get(group)
      );
    } else return {} as KeyValueAnyType;
  }, [group, imageAlbums]);
  const items = useMemo(
    () => (album ? { ...album?.gallery?.generate, ...album } : undefined),
    [album],
  );
  return useMemo(
    () => (
      <GalleryObjectConvert
        items={items}
        max={40}
        step={28}
        linkLabel={false}
        hideWhenEmpty={false}
      />
    ),
    [items],
  );
}

export function GalleryObjectConvert(args: GalleryObjectConvertProps) {
  let { items, submitPreventScrollReset } = args;
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
    [],
  );
  const convertItemObjectType = useCallback(
    (item: GalleryItemType) =>
      typeof item === "string" ? { name: item } : item,
    [],
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
    [items, pickupList, topImageList, imageAlbums],
  );
  return useMemo(
    () => (
      <GalleryObject
        {...args}
        items={albums}
        submitPreventScrollReset={submitPreventScrollReset}
        {...(Array.isArray(items) ? {} : { h2: items?.h2, h4: items?.h4 })}
      />
    ),
    [albums, submitPreventScrollReset, items, args],
  );
}

export const useGalleryObject = CreateObjectState<GalleryObjectType>({
  items: [],
  images: [],
  filteredGroups: [],
  filteredYearGroups: [],
});
interface qParamsMemoProps extends GalleryItemVisibleProps, GalleryTotalProps {
  qParam: string;
}

export function GalleryObject(args: GalleryObjectProps) {
  let { items: _items, hideWhenEmpty } = args;
  const { charactersMap, charactersNameMap } = useCharacters();
  const searchParams = useSearchParams()[0];
  const sortParam = searchParams.get("sort");
  const typeParam = searchParams.get("type");
  const filterParam = searchParams.get("filter");
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const totalParam = searchParams.get("total");
  const monthModeParam = (searchParams.get("monthMode") ||
    "time") as MonthSearchModeType;
  const qSearchParam = searchParams.get("q") || "";
  let {
    qParam,
    visibleCreationTime,
    visibleLikeCount,
    visibleYear,
    totalCount,
    totalCreationTime,
    totalLikeCount,
  } = useMemo<qParamsMemoProps>(() => {
    let visibleCreationTime = false;
    let visibleLikeCount = false;
    let visibleYear = false;
    let totalCreationTime = false;
    let totalLikeCount = false;
    let totalCount = false;
    const qParam = qSearchParam
      .split(" ")
      .filter((_) => {
        const [K, V] = _.split(":");
        const k = K.toLocaleLowerCase();
        if (k === "visible") {
          const v = V.toLocaleLowerCase();
          switch (v) {
            case "creationtime":
              visibleCreationTime = true;
              break;
            case "like":
              visibleLikeCount = true;
              break;
            case "year":
              visibleYear = true;
              break;
          }
          return false;
        } else if (k === "total") {
          const v = V.toLocaleLowerCase();
          switch (v) {
            case "creationtime":
              visibleCreationTime = true;
              totalCreationTime = true;
              break;
            case "like":
              visibleLikeCount = true;
              totalLikeCount = true;
              break;
            case "count":
              totalCount = true;
              break;
          }
          return false;
        } else return true;
      })
      .join(" ");
    return {
      qParam,
      visibleCreationTime,
      visibleLikeCount,
      visibleYear,
      totalCreationTime,
      totalLikeCount,
      totalCount,
    };
  }, [qSearchParam]);
  const tagsParam = searchParams.get("tags")?.toLowerCase();
  const copyrightParam = searchParams.get("copyright");
  const viewModeParam = searchParams.get("viewMode");
  const charactersParam = searchParams.get("characters"?.toLowerCase());
  const { imageAlbums } = useImageState();
  const year = Number(yearParam);
  const filterMonthly = useCallback(
    (month: string | null) =>
      filterGalleryMonthList.find((v) => String(v.month) === month),
    [filterGalleryMonthList],
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
  const draftOnly = useMemo(
    () => searchParams.has("draftOnly"),
    [searchParams],
  );
  const hasTopImage = useMemo(
    () => searchParams.has("topImage"),
    [searchParams],
  );
  const searchMode = useMemo(
    () =>
      Boolean(
        qParam ||
          tagsParam ||
          copyrightParam ||
          charactersParam ||
          showAllAlbum,
      ),
    [qParam, tagsParam, copyrightParam, charactersParam, showAllAlbum],
  );
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
        hashtag: {
          map: { characters: charactersNameMap },
          key: ["tags"],
          textKey: ["description"],
        },
      }),
    [qParam, charactersNameMap],
  );
  const whereTagsValue = useMemo(() => {
    const tags = tagsParam?.split(",");
    if (tags) return tags;
  }, [tagsParam]);
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
  const charactersWhere = useMemo(() => {
    const charaListMap = new Map<string, void>();
    charactersParam?.split(",").forEach((v) => charaListMap.set(v));
    whereTagsValue?.forEach((v) => {
      if (charactersMap.has(v)) charaListMap.set(v);
      else if (charactersNameMap.has(v))
        charaListMap.set(charactersNameMap.get(v)!);
    });
    const list = Array.from(charaListMap.keys());
    if (list.length) return { characters: { every: list } };
  }, [charactersParam, whereTagsValue, charactersMap, charactersNameMap]);
  const kindTagsWhere = useMemo(() => {
    const OR: findWhereType<ImageType>[] = [];
    const AND: findWhereType<ImageType>[] = [];
    if (someTagsWhere) AND.push(someTagsWhere);
    if (everyTagsWhere) AND.push(everyTagsWhere);
    if (AND.length) OR.push({ AND });
    if (charactersWhere) OR.push(charactersWhere);
    if (OR.length) return { OR };
    else return null;
  }, [someTagsWhere, everyTagsWhere, charactersWhere]);
  const copyrightWhere = useMemo(() => {
    const list = copyrightParam?.split(",");
    if (list) return { copyright: { every: list } };
  }, [copyrightParam]);
  const likeWhere = useMemo(() => filterParam === "like", [filterParam]);
  const linkStateUpdated = useLikeStateUpdated()[0];
  const hasPickup = useMemo(() => searchParams.has("pickup"), [searchParams]);
  const wheres = useMemo(() => {
    const wheres = [where];
    if (kindTagsWhere) wheres.push(kindTagsWhere);
    if (copyrightWhere) wheres.push(copyrightWhere);
    if (hasTopImage) wheres.push({ topImage: { gte: 1 } });
    if (hasPickup) wheres.push({ pickup: true });
    if (likeWhere) wheres.push({ like: { checked: true } });
    if (typeParam) wheres.push({ type: typeParam as imageKindType });
    if (draftOnly) wheres.push({ draft: true });
    return wheres;
  }, [
    where,
    kindTagsWhere,
    copyrightWhere,
    hasTopImage,
    hasPickup,
    likeWhere,
    typeParam,
    draftOnly,
  ]);
  const orderBySort = useMemo(() => {
    const list: OrderByItem<ImageType>[] = [...orderBy];
    const searchSort = sortParam as defineSortTagsUnion;
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
      case "creationTimeOrder":
        list.push({ creationTime: { time: "desc" } });
        break;
      case "shortnessCreationTimeOrder":
        list.push({ creationTime: { time: "asc" } });
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
  const isTotalGeneral = useMemo(() => totalParam === "general", [totalParam]);
  visibleCreationTime = useMemo(
    () => visibleCreationTime || orderBySort.some((v) => "creationTime" in v),
    [visibleCreationTime, orderBySort],
  );
  totalCreationTime = useMemo(
    () => totalCreationTime || (visibleCreationTime && isTotalGeneral),
    [totalCreationTime, visibleCreationTime, isTotalGeneral],
  );
  visibleLikeCount = useMemo(
    () => visibleLikeCount || orderBySort.some((v) => "like" in v),
    [visibleLikeCount, orderBySort],
  );
  totalLikeCount = useMemo(
    () => totalLikeCount || (visibleLikeCount && isTotalGeneral),
    [totalLikeCount, visibleLikeCount, isTotalGeneral],
  );
  totalCount = totalCount || isTotalGeneral;

  let filteredGroups = items;
  filteredGroups = useMemo(() => {
    return filteredGroups.map<GalleryItemObjectType>((group) => {
      if (
        group.hide ||
        (group.hideWhenFilter &&
          (searchMode || typeParam || monthParam || hasPickup || hasTopImage))
      ) {
        return { ...group, list: [] };
      } else {
        let images = group.list || [];
        if (monthModeParam === "time" && monthParam) {
          images = images.filter(({ time }) => {
            return time ? String(time.getMonth() + 1) === monthParam : false;
          });
        }
        images = findMee([...images], {
          where: { AND: wheres },
          orderBy: orderBySort,
        });
        return { ...group, list: images };
      }
    });
  }, [
    filteredGroups,
    searchMode,
    typeParam,
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
          { name: "gallery", list: [] },
        ),
      ].map((v) => {
        v.list = findMee(v.list!, {
          orderBy: orderBySort,
        });
        return v;
      });
    } else return filteredGroups;
  }, [filteredGroups, viewModeParam, orderBySort]);

  const filteredGroupsToYList = useMemo(() => {
    return filteredGroups.map<GalleryItemObjectType>((group) => {
      if (
        !(searchMode || typeParam || draftOnly || hasPickup || topAlbum) &&
        group.hideWhenDefault
      ) {
        return { ...group, list: [] };
      } else {
        return group;
      }
    });
  }, [filteredGroups, searchMode, typeParam, draftOnly, hasPickup, topAlbum]);

  const filteredYearGroups = useMemo(() => {
    return filteredGroupsToYList.map<GalleryItemObjectType>(
      ({ list, ...item }) => {
        if (year && list)
          return {
            list: list.filter((item) => item.year === year),
            ...item,
          };
        return { list, ...item };
      },
    );
  }, [filteredGroupsToYList, year]);
  useLayoutEffect(() => {
    const images = filteredGroupsToYList.reduce<ImageType[]>((a, c) => {
      if (!c.notYearList) {
        c.list?.forEach((image) => {
          a.push(image);
        });
      }
      return a;
    }, []);
    Set({
      filteredGroups: filteredGroupsToYList,
      filteredYearGroups: filteredGroupsToYList,
      images,
    });
  }, [filteredGroupsToYList, filteredYearGroups, Set]);
  useLayoutEffect(() => {
    Set({ items });
  }, [items, Set]);
  const yfList = useMemo(
    () => filteredYearGroups.map<ImageType[]>(({ list }) => list || []),
    [filteredYearGroups],
  );
  const imagesforTags = useMemo(() => {
    return filteredGroups
      .map((group, i) => {
        return {
          images: group.list || [],
          flag: !group.hide && group.name !== "pickup" && group.list,
        };
      })
      .reduce<ImageType[]>((a, { images, flag }) => {
        if (flag) {
          images.forEach((image) => {
            if (!year || image.year === year) {
              a.push(image);
            }
          });
        }
        return a;
      }, []);
  }, [filteredGroups, year]);
  return useMemo(
    () => (
      <GalleryBody
        {...args}
        items={filteredGroupsToYList}
        imagesforTags={imagesforTags}
        yfList={yfList}
        totalCount={totalCount}
        visibleCreationTime={visibleCreationTime}
        totalCreationTime={totalCreationTime}
        visibleLikeCount={visibleLikeCount}
        totalLikeCount={totalLikeCount}
        visibleYear={visibleYear}
      />
    ),
    [
      args,
      filteredGroupsToYList,
      imagesforTags,
      yfList,
      totalCount,
      visibleCreationTime,
      totalCreationTime,
      visibleLikeCount,
      totalLikeCount,
      visibleYear,
    ],
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
        (f) => Math.abs(nowTime - f.lastModified) > 10,
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
    [item, character, apiOrigin, webp, thumbnail, notDraft, tags],
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
  imagesforTags: ImageType[];
  yfList: ImageType[][];
}
function GalleryBody({
  items,
  imagesforTags,
  yfList,
  showInPageMenu = true,
  showGalleryHeader = true,
  showGalleryLabel = true,
  showCount = true,
  submitPreventScrollReset,
  h2,
  h4,
  visibleCreationTime,
  visibleLikeCount,
  visibleYear,
  totalCreationTime,
  totalLikeCount,
  totalCount,
}: GalleryBodyProps) {
  const { Set: SetImageViewer } = useImageViewer();
  useEffect(() => {
    SetImageViewer({ loop: false });
  }, []);
  const search = useSearchParams()[0];
  const tagsParam = useMemo(() => getSearchParamMap("tags", search), [search]);
  const copyrightParam = useMemo(
    () => getSearchParamMap("copyright", search),
    [search],
  );
  const typeParam = useMemo(() => search.get("type"), [search]);
  const filterParam = useMemo(
    () => getSearchParamMap("filter", search),
    [search],
  );
  const nav = useNavigate();
  const { group } = useParams();
  const args = useMemo(
    () => ({
      showInPageMenu,
      showGalleryHeader,
      showGalleryLabel,
      showCount,
      visibleCreationTime,
      visibleLikeCount,
      visibleYear,
    }),
    [
      showInPageMenu,
      showGalleryHeader,
      showGalleryLabel,
      showCount,
      visibleCreationTime,
      visibleLikeCount,
      visibleYear,
    ],
  );
  const isLogin = useIsLogin()[0];
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
    () => getCountList(imagesforTags, "tags").sort((a, b) => b.count - a.count),
    [imagesforTags],
  );
  const copyrightList = useMemo(
    () =>
      getCountList(imagesforTags, "copyright").sort(
        (a, b) => b.count - a.count,
      ),
    [imagesforTags],
  );
  const typeMap = useMemo(
    () =>
      getCountList(imagesforTags, "type").reduce<Map<string, ValueCountType>>(
        (a, c) => {
          a.set(c.value, c);
          return a;
        },
        new Map(),
      ),
    [imagesforTags],
  );
  const likedCountValue = useMemo<ValueCountType>(
    () => ({
      value: "liked",
      count: imagesforTags.filter((image) => likeCheckedMap?.has(image.key))
        .length,
    }),
    [imagesforTags, likeCheckedMap],
  );
  const callbackOptions = useCallback(
    (options: ContentsTagsOption[]) => {
      const cloneTagsParam = new Map(tagsParam);
      const otherTags = tagsList.filter(({ value: tag }) =>
        simpleDefaultTags.every(({ value }) => value !== tag),
      );
      const defaultTagsMap = new Map(
        tagsList
          .filter(({ value }) =>
            otherTags.every(({ value: ov }) => value !== ov),
          )
          .map((v) => [v.value, v]),
      );
      function defaultReplace(
        options: ContentsTagsOption[],
        parent?: ContentsTagsOption,
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
        "copyright",
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
    ],
  );
  const inPageList = useMemo(
    () =>
      yfList
        .map((_, i) => items[i])
        .map(({ label, name }, i) => ({
          name: label || name || "",
          id: name,
        })),
    [yfList, items],
  );
  const galleryItem = useMemo(() => {
    return items
      .map((item, i) => ({ ...item, i }))
      .filter(({ hideWhenEmpty = true, i }) =>
        hideWhenEmpty ? yfList[i].length : true,
      )
      .map(({ i, ...item }) => (
        <div key={`gallery_item_${item.name}`}>
          {isLogin ? (
            <UploadChain item={item}>
              <GalleryContent
                id={item.name}
                list={yfList[i]}
                item={item}
                {...args}
              />
            </UploadChain>
          ) : (
            <GalleryContent
              id={item.name}
              list={yfList[i]}
              item={item}
              {...args}
            />
          )}
        </div>
      ));
  }, [items, yfList, args]);
  const linksState = useLinks();
  const linksList = useMemo(() => {
    return (linksState.links || []).filter((link) =>
      link.tags?.some(
        (v) => v === typeParam || group === v || tagsParam.has(v),
      ),
    );
  }, [linksState.links, tagsParam, group, typeParam]);
  const SearchAreaOptions = useMemo(
    () => ({ submitPreventScrollReset }),
    [submitPreventScrollReset],
  );
  const [totalTimeLabel, targetTimeCount] = useMemo<
    [string | null, number]
  >(() => {
    if (totalCreationTime) {
      const counts = imagesforTags.reduce(
        (a, c) => {
          a[0] += c.creationTime?.time || 0;
          a[1] += c.creationTime && !isNaN(c.creationTime.time) ? 1 : 0;
          return a;
        },
        [0, 0],
      );
      const time = new TimeClass(counts[0]);
      return [counts[1] ? "作業時間 " + time.FormatToJP() : "", counts[1]];
    } else return [null, 0];
  }, [totalCreationTime, imagesforTags]);
  const [totalLikeLabel, targetLikeCount] = useMemo<
    [string | null, number]
  >(() => {
    if (totalLikeCount) {
      const counts = imagesforTags.reduce(
        (a, c) => {
          a[0] += c.like?.count || 0;
          a[1] += c.like?.count ? 1 : 0;
          return a;
        },
        [0, 0],
      );
      return [counts[1] ? "♥" + counts[0] : "", counts[1]];
    } else return [null, 0];
  }, [totalLikeCount, imagesforTags]);
  const totalCountLabel = useMemo(() => {
    if (totalCount) {
      let label = "全" + imagesforTags.length.toString() + "作品";
      if (targetTimeCount || targetLikeCount) {
        label += "中 " + Math.max(targetTimeCount, targetLikeCount) + "作品";
      }
      return label;
    } else return null;
  }, [totalCount, imagesforTags, targetTimeCount, targetLikeCount]);
  const totals = useMemo(() => {
    const labels: string[] = [];
    if (totalCountLabel) labels.push(totalCountLabel);
    if (totalTimeLabel) labels.push(totalTimeLabel);
    if (totalLikeLabel) labels.push(totalLikeLabel);
    return labels;
  }, [totalCountLabel, totalTimeLabel, totalLikeLabel]);
  return (
    <div className="galleryContainer">
      {showInPageMenu && !group ? (
        <InPageMenu list={inPageList} adjust={64} />
      ) : null}
      <div>
        {showGalleryHeader ? (
          <div>
            <div className="header">
              {useMemo(
                () => (
                  <>
                    <GalleryYearFilter {...SearchAreaOptions} />
                    <GallerySearchArea {...SearchAreaOptions} />
                    <div className="flex">
                      <GalleryCharactersSelect {...SearchAreaOptions} />
                      <GalleryTagsSelect
                        {...SearchAreaOptions}
                        callbackOptions={callbackOptions}
                      />
                    </div>
                  </>
                ),
                [SearchAreaOptions, callbackOptions],
              )}
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
        {totals.length > 0 ? (
          <p className="color-dark">合計: {totals.join(", ")}</p>
        ) : null}
        {h2 || h4 ? (
          <div className="galleryLabel outLabel">
            {h2 ? <h2>{h2}</h2> : null}
            {h4 ? <h4>{h4}</h4> : null}
          </div>
        ) : null}
        {linksList.length > 0 ? (
          <EditableLinksContainer
            className="linksArea-parent"
            title="Links"
            banner
            links={linksList}
            state={linksState}
            indexedDB={linksDataIndexed}
          />
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

interface GalleryImageItemProps extends GalleryItemVisibleProps {
  galleryName?: string;
  image: ImageType;
  onClick?: (image: ImageType) => void;
  visible?: boolean;
}
function GalleryImageItem({
  galleryName,
  image,
  onClick,
  visible: visibleImage,
  visibleCreationTime,
  visibleLikeCount,
  visibleYear,
}: GalleryImageItemProps) {
  const toStatehandler = useCallback((): {
    to: To;
    state?: any;
    preventScrollReset?: boolean;
    title?: string;
  } => {
    const searchParams = new URLSearchParams(location.search);
    if (image.direct) return { to: image.src ?? "" };
    searchParams.set("image", image.key);
    if (galleryName && image.albumObject?.name !== galleryName)
      searchParams.set("group", galleryName);
    else if (image.albumObject?.name)
      searchParams.set("album", image.albumObject.name);
    return {
      to: new URL("?" + searchParams.toString(), location.href).href,
      state: { from: location.pathname, keep: true },
      preventScrollReset: true,
      title: image.title || undefined,
    };
  }, [image]);
  const ImageTimeFrameTag = useMemo(() => {
    return TimeframeTags.find((tt) =>
      image.tags?.some((tag) => tt.value === tag),
    )?.value;
  }, [image]);
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
          <GalleryItemRibbon
            image={image}
            visibleCreationTime={visibleCreationTime}
            visibleLikeCount={visibleLikeCount}
            visibleYear={visibleYear}
          />
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
          ) : image.type === "multi" ? (
            <div className="translucent-special-button">
              <PiImagesFill />
            </div>
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
}

interface GalleryContentProps extends GalleryBodyOptions {
  id?: string;
  className?: string;
  item: GalleryItemObjectType;
  list: ImageType[];
  ref?: React.RefObject<HTMLDivElement | null>;
}
function GalleryContent(args: GalleryContentProps) {
  const { item, list } = useMemo(() => args, [args]);
  const { state } = useLocation();
  const curMaxStateName = useMemo(() => "galleryMax-" + item.name, [item.name]);
  const max = state?.[curMaxStateName];
  const Main = useMemo(() => {
    return (
      <GalleryContentMain
        {...args}
        item={item}
        stateMax={max}
        curMaxStateName={curMaxStateName}
        list={list}
      />
    );
  }, [item, curMaxStateName, list, args]);
  return Main;
}
interface GalleryContentMainProps extends GalleryContentProps {
  stateMax?: number;
  curMaxStateName: string;
}
function GalleryContentMain(args: GalleryContentMainProps) {
  let {
    item,
    list,
    className,
    showGalleryLabel,
    showCount,
    ref,
    stateMax,
    curMaxStateName,
    visibleCreationTime,
    visibleLikeCount,
    visibleYear,
    id,
  } = useMemo(() => args, [args]);
  let {
    name,
    linkLabel,
    label,
    step = 20,
    max: maxFromArgs = 20,
    maxWhenSearch = 40,
    type,
  } = item;
  const { pathname, search, hash } = useLocation();
  const [searchParams] = useSearchParams();
  const tags = searchParams.get("tags");
  const q = searchParams.get("q");
  const characters = searchParams.get("characters");
  const searchMode = useMemo(
    () => Boolean(q || tags || characters),
    [q, tags, characters],
  );
  const [w] = useWindowSize();
  const max = useMemo(
    () => (searchMode ? maxWhenSearch : maxFromArgs),
    [maxFromArgs, maxWhenSearch, searchMode],
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
    [searchParams],
  );
  const imageOnClick = useMemo(() => {
    if (isModal)
      return function (image: ImageType) {
        Set({ image });
      };
  }, [isModal]);
  const showMoreButton = curMax < (list.length || 0);
  const visibleMax = showMoreButton ? curMax - 1 : curMax;
  const headerLinkTo = useCallback(
    (to: string, setSearch = true) => {
      const url = new URL(
        to + (setSearch ? search : ""),
        location.origin + pathname,
      );
      url.searchParams.delete("showAllAlbum");
      if (url.searchParams.has("type")) {
        if (type === searchParams.get("type")) url.searchParams.delete("type");
      }
      return url.href;
    },
    [name, type, pathname, search],
  );
  const HeaderElm = useCallback(
    ({ label }: { label?: string }) =>
      label && linkLabel ? (
        <Link
          to={headerLinkTo(
            typeof linkLabel === "string" ? linkLabel : "/gallery/" + name,
          )}
        >
          {label}
        </Link>
      ) : (
        <>{label}</>
      ),
    [linkLabel, name, pathname, search],
  );
  const GalleryLabel = useMemo(
    () =>
      showGalleryLabel ? (
        <div className="galleryLabel">
          <h2 className="en-title-font">
            <HeaderElm label={labelString} />
          </h2>
          {showCount ? <div className="count">({list.length})</div> : null}
        </div>
      ) : null,
    [showGalleryLabel, labelString, list.length, showCount, pathname, search],
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
  const visibleImage = useMemo(() => hash !== "#laymic", [hash]);
  return (
    <div id={id} ref={ref} className={_className}>
      {GalleryLabel}
      <div className={listClassName}>
        {useMemo(
          () =>
            list
              .filter((_, i) => i < visibleMax)
              .map((image, i) => (
                <GalleryImageItem
                  image={image}
                  galleryName={name}
                  onClick={imageOnClick}
                  key={image.key}
                  visible={visibleImage}
                  visibleCreationTime={visibleCreationTime}
                  visibleLikeCount={visibleLikeCount}
                  visibleYear={visibleYear}
                />
              )),
          [
            list,
            name,
            imageOnClick,
            isModal,
            visibleImage,
            visibleCreationTime,
            visibleLikeCount,
            visibleYear,
            visibleMax,
          ],
        )}
        {showMoreButton ? (
          <a
            onClick={(e) => {
              e.preventDefault();
              ShowMore();
            }}
            title="もっと見る"
            className="item"
            role="button"
          >
            <MoreButton className="gallery-button-more" />
          </a>
        ) : null}
      </div>
      {/* <div className="loadingNow text-main-soft my-4">よみこみちゅう…</div> */}
    </div>
  );
}

export const useImageYearRibbonSwitch = CreateState(false);

export function GalleryYearFilter({
  submitPreventScrollReset = true,
}: SearchAreaOptionsProps) {
  const { filteredGroups } = useGalleryObject();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = Number(searchParams.get("year") ?? NaN);
  const isOlder = searchParams.get("sort") === "leastRecently";
  const yearSelectRef = React.useRef<HTMLSelectElement>(null);
  const [yearRibbon, setYearRibbon] = useImageYearRibbonSwitch();
  const yearListBase = useMemo(
    () =>
      getYearObjects(
        filteredGroups
          .filter((item) => !item.notYearList)
          .reduce<number[]>((a, c) => {
            (c.list || []).forEach(({ year }) => {
              if (year) a.push(year);
            });
            return a;
          }, []),
      ),
    [filteredGroups],
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
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLSelectElement, MouseEvent>) => {
      e.preventDefault();
      setYearRibbon((v) => !v);
    },
    [],
  );
  return (
    <select
      title="年フィルタ"
      className="noBorder year"
      ref={yearSelectRef}
      value={year || ""}
      onChange={changeHandler}
      onContextMenu={onContextMenu}
    >
      {yearList.map(({ value, label }, i) => (
        <option key={`gallery_year_${value}`} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

interface SearchAreaProps
  extends React.HTMLAttributes<HTMLFormElement>,
    SearchAreaOptionsProps {}

export function GallerySearchArea(args: SearchAreaProps) {
  let { className, submitPreventScrollReset = true } = useMemo(
    () => args,
    [args],
  );
  const formArgs = useMemo(() => {
    const { className, submitPreventScrollReset, ...formArgs } = args;
    return formArgs;
  }, [args]);

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
    { enableOnFormTags: ["INPUT"] },
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
    [searchParams],
  );
  return (
    <form className={className} onSubmit={submitHandler} {...formArgs}>
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

function getYearObjects(dates: (Date | number | null | undefined)[]) {
  return dates
    .map((date) => {
      switch (typeof date) {
        case "number":
          return date;
        case "object":
          return getYear(date);
        default:
          return 0;
      }
    })
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
    "leastRecently",
    "nameOrder",
    "leastNameOrder",
    "creationTimeOrder",
    "shortnessCreationTimeOrder",
    "likeCount",
    "mix",
    "total",
  ]),
];
export function GalleryTagsSelect(args: SelectAreaProps) {
  const addOptions = useMemo(() => args.addOptions, [args]);
  const callbackOptions = useMemo(() => args.callbackOptions, [args]);
  const tagsSelectArgs = useMemo<SelectAreaProps>(
    () => ({
      className: args.className,
      submitPreventScrollReset: args.submitPreventScrollReset,
    }),
    [args],
  );
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
  return <ContentsTagsSelect {...tagsSelectArgs} tags={tags} />;
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
      list?.some((item) => item === value),
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

interface GalleryItemRibbonProps extends GalleryItemVisibleProps {
  image: ImageType;
}
interface GalleryItemRibbonListType {
  className?: string;
  label: string;
}
function GalleryItemRibbon({
  image,
  visibleCreationTime,
  visibleLikeCount,
  visibleYear,
}: GalleryItemRibbonProps) {
  const schedule =
    image.schedule && image.lastmod && image.lastmod.getTime() > Date.now();
  const itemOfUpdate = useMemo<null | GalleryItemRibbonListType>(() => {
    if (image.draft) return { label: "Draft", className: "draft" };
    else if (schedule) return { label: "Schedule", className: "schedule" };
    else if (image.update) {
      if (image.new) return { label: "New!", className: "new" };
      else return { label: "Update", className: "update" };
    } else return null;
  }, [image, schedule]);
  const yearRibbon = useImageYearRibbonSwitch()[0];
  const itemOfCreationTime = useMemo<
    GalleryItemRibbonListType | undefined
  >(() => {
    if (
      visibleCreationTime &&
      image.creationTime &&
      !isNaN(image.creationTime.time)
    ) {
      return { label: image.creationTime!.FormatToJP() };
    }
  }, [visibleCreationTime, image]);
  const itemOfLikeCount = useMemo<GalleryItemRibbonListType | undefined>(() => {
    if (visibleLikeCount && image.like && image.like.count) {
      return { label: image.like.count.toString(), className: "like" };
    }
  }, [visibleLikeCount, image]);
  const itemOfYear = useMemo<GalleryItemRibbonListType | undefined>(() => {
    if ((visibleYear || yearRibbon) && image.year) {
      return {
        label: image.year.toString(),
        className: "year",
      };
    }
  }, [visibleYear, yearRibbon, image]);
  const list = useMemo(() => {
    const list: GalleryItemRibbonListType[] = [];
    if (itemOfYear) list.push(itemOfYear);
    if (itemOfCreationTime) list.push(itemOfCreationTime);
    if (itemOfLikeCount) list.push(itemOfLikeCount);
    if (itemOfUpdate) list.push(itemOfUpdate);
    return list;
  }, [itemOfUpdate, itemOfCreationTime, itemOfLikeCount, itemOfYear]);

  return (
    <>
      {list.length > 0 ? (
        <div className="ribbon">
          {list.map((item) => (
            <div key={`ribbon-${item.label}`} className={item.className}>
              {item.label}
            </div>
          ))}
        </div>
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
    [searchParams],
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
