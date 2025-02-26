import {
  Link,
  To,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useImageState, useSelectedImage } from "@/state/ImageState";
import { useDataIsComplete } from "@/state/StateSet";
import React, {
  ReactNode,
  createRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  defineSortTags,
  filterGalleryMonthList,
  addExtentionTagsOptions,
  defaultGalleryTags,
  MonthToTag,
  ContentsTagsOption,
} from "@/components/dropdown/SortFilterTags";
import { filterPickFixed } from "@/functions/media/FilterImages";
import { InPageMenu } from "@/layout/InPageMenu";
import { useDropzone } from "react-dropzone";
import {
  RiBook2Fill,
  RiChatPrivateLine,
  RiFilePdf2Fill,
  RiHomeGearLine,
  RiMenuSearchLine,
  RiPlayLargeFill,
  RiPushpin2Line,
  RiStore3Fill,
} from "react-icons/ri";
import { ImageMeeThumbnail } from "@/layout/ImageMee";
import MoreButton from "../components/svg/button/MoreButton";
import { getYear } from "@/functions/DateFunction";
import { findMee, setWhere } from "@/functions/find/findMee";
import { useHotkeys } from "react-hotkeys-hook";
import { ContentsTagsSelect } from "@/components/dropdown/SortFilterReactSelect";
import useWindowSize from "@/components/hook/useWindowSize";
import { useImageViewer } from "@/layout/ImageViewer";
import {
  ImagesUploadWithToast,
  SwitchNotDraftUpload,
  SwitchNoUploadThumbnail,
  SwitchUploadWebp,
  useImageEditSwitchHold,
  useImageNotDraftUpload,
  useNoUploadThumbnail,
  useUploadWebp,
} from "@/layout/edit/ImageEditForm";
import { useApiOrigin, useIsLogin } from "@/state/EnvState";
import { imageDataObject, likeDataObject } from "@/state/DataState";
import { useCharacters, useCharactersMap } from "@/state/CharacterState";
import { callReactSelectTheme } from "@/components/define/callReactSelectTheme";
import { BiPhotoAlbum } from "react-icons/bi";
import { charaTagsLabel } from "@/components/FormatOptionLabel";
import { ModeSearchSwitch, ModeSwitch } from "@/layout/edit/CommonSwitch";
import { ComicsViewer } from "@/routes/ComicsViewer";
import { AiFillEdit } from "react-icons/ai";
import {
  DropdownButton,
  IconsFoldButton,
} from "@/components/dropdown/DropdownButton";
import {
  CompatGalleryButton,
  CompatMendingThumbnailButton,
  GalleryImportButton,
  GalleryUploadButton,
} from "./edit/ImagesManager";
import { Modal } from "@/layout/Modal";
import { ObjectDownloadButton } from "@/components/button/ObjectDownloadButton";
import { TbDatabaseImport } from "react-icons/tb";
import { Md3dRotation, MdInsertDriveFile, MdMoveToInbox } from "react-icons/md";
import { ArrayEnv } from "@/ArrayEnv";
import { useLikeStateUpdated } from "@/state/LikeState";
import { CreateObjectState } from "@/state/CreateState";
import { useLang } from "@/state/LangState";
import { setCharaLangName } from "./CharacterPage";
import { CustomReactSelect } from "@/components/dropdown/CustomReactSelect";

interface GalleryPageProps extends GalleryBodyOptions {
  children?: ReactNode;
  showAll?: boolean;
}
export function GalleryPage({ children, ...args }: GalleryPageProps) {
  const { galleryAlbums } = useImageState();
  const [isComplete] = useDataIsComplete();
  return (
    <div className="galleryPage">
      {children}
      {isComplete ? (
        <GalleryObjectConvert items={galleryAlbums} {...args} />
      ) : null}
    </div>
  );
}

export function GalleryGroupPageRoot({}: SearchAreaOptionsProps) {
  const { group } = useParams();
  return <>{group === "ebook" ? <ComicsViewer /> : <GalleryGroupPage />}</>;
}

function GalleryGroupPage() {
  const { group } = useParams();
  const album = useMemo(
    () =>
      ArrayEnv.IMAGE_ALBUMS?.find(
        (album) => (typeof album === "string" ? album : album.name) === group
      ),
    [group]
  );
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
                  list: filterPickFixed({ images: images || [], name }),
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
    [items, images, imageAlbums]
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
  fList: [],
  yfList: [],
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
  const charactersParam = searchParams.get("characters"?.toLowerCase());
  const { imageAlbums } = useImageState();
  const searchMode = useMemo(
    () => Boolean(qParam || tagsParam || charactersParam),
    [qParam, tagsParam || charactersParam]
  );
  const year = Number(yearParam);
  const filterMonthly = useCallback(
    (month: string | null) =>
      filterGalleryMonthList.find((v) => String(v.month) === month),
    [filterGalleryMonthList]
  );
  const whereMonth = useMemo<findWhereType<ImageType> | null>(() => {
    if (monthParam) {
      switch (monthModeParam) {
        case "event":
          const monthly = filterMonthly(monthParam);
          if (monthly) return { tags: { in: monthly.tags } };
          break;
        case "tag":
          const _monthly = filterMonthly(monthParam);
          const monthTags = _monthly?.tags.find((v, i) => i === 0);
          if (monthTags) return { tags: { contains: monthTags } };
          break;
      }
    }
    return null;
  }, [monthModeParam, monthParam]);
  const isLogin = useIsLogin()[0];
  const showAllAlbum = searchParams.has("showAllAlbum");
  const items = useMemo(() => {
    if (isLogin && showAllAlbum)
      return _items.map((item) => ({
        ...item,
        hideWhenEmpty: hideWhenEmpty,
        hide: false,
      }));
    else return _items;
  }, [_items, showAllAlbum, hideWhenEmpty, isLogin, imageAlbums]);
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
          ],
        },
        hashtag: { key: ["tags", "characters"], textKey: ["description"] },
      }),
    [qParam]
  );
  const tagsWhere = useMemo(
    () =>
      tagsParam?.split(",")?.map<findWhereType<ImageType>>((value) => ({
        tags: { contains: value },
      })),
    [tagsParam]
  );
  const charactersWhere = useMemo(
    () =>
      charactersParam?.split(",")?.map<findWhereType<ImageType>>((value) => ({
        characters: { contains: value },
      })),
    [charactersParam]
  );
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
    if (tagsWhere) wheres.push(...tagsWhere);
    if (charactersWhere) wheres.push(...charactersWhere);
    if (whereMonth) wheres.push(whereMonth);
    if (hasTopImage) wheres.push({ topImage: { gte: 1 } });
    if (hasPickup) wheres.push({ pickup: true });
    if (likeWhere) wheres.push({ like: { checked: true } });
    if (typeParam) wheres.push({ type: typeParam });
    if (draftOnly) wheres.push({ draft: true });
    return wheres;
  }, [
    where,
    tagsWhere,
    charactersWhere,
    whereMonth,
    hasTopImage,
    hasPickup,
    likeWhere,
    typeParam,
    draftOnly,
  ]);
  const orderBySort = useMemo(() => {
    const list: OrderByItem<OldMediaImageItemType>[] = [...orderBy];
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
    }
    if (hasTopImage) list.push({ topImage: "desc" });
    const keys = list.reduce((a, c) => {
      Object.keys(c).forEach((v) => a.push(v));
      return a;
    }, [] as string[]);
    if (keys.every((key) => key !== "time")) list.unshift({ time: "desc" });
    if (keys.every((key) => key !== "name")) list.unshift({ name: "asc" });
    return list;
  }, [sortParam, orderBy, hasTopImage]);

  const { fList, yfList } = useMemo(() => {
    const fList = items
      .map((item) =>
        item.hide ||
        (!searchMode && item.hideWhenDefault) ||
        (item.hideWhenFilter &&
          (searchMode || typeParam || monthParam || hasPickup || hasTopImage))
          ? []
          : item.list ?? []
      )
      .map((images) => {
        if (monthModeParam === "time" && monthParam) {
          images = images.filter(({ time }) => {
            return time ? String(time.getMonth() + 1) === monthParam : false;
          });
        }
        images = findMee([...images], {
          where: { AND: wheres },
          orderBy: orderBySort,
        });
        return images;
      });
    const yfList = fList.map((images) => {
      if (year) images = images.filter((item) => getYear(item.time) === year);
      return images;
    });
    return { fList, yfList };
  }, [
    items,
    searchMode,
    monthModeParam,
    monthParam,
    wheres,
    orderBySort,
    year,
    hasPickup,
    hasTopImage,
    linkStateUpdated,
  ]);
  useLayoutEffect(() => {
    Set({ fList, yfList });
  }, [fList, yfList]);
  useLayoutEffect(() => {
    Set({ items });
  }, [items]);
  return (
    <>
      <GalleryBody items={items} yfList={yfList} {...args} />
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
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
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
        apiOrigin,
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
        setImagesLoad("no-cache");
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
  const { group } = useParams();
  const args = {
    showInPageMenu,
    showGalleryHeader,
    showGalleryLabel,
    showCount,
  };
  const isLogin = useIsLogin()[0];
  const refList = items?.map(() => createRef<HTMLDivElement>()) ?? [];
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
                <GalleryTagsSelect {...SearchAreaOptions} className="flex-1" />
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
                  <ObjectDownloadButton
                    className="squared item text-left"
                    dataObject={imageDataObject}
                  >
                    ギャラリーJSONデータのダウンロード
                  </ObjectDownloadButton>
                  <GalleryImportButton
                    icon={<TbDatabaseImport />}
                    className="squared item text-left"
                    overwrite={false}
                  >
                    ギャラリーJSONデータのインポート
                  </GalleryImportButton>
                  <GalleryImportButton
                    icon={<TbDatabaseImport />}
                    className="squared item text-left"
                    overwrite={true}
                  >
                    ギャラリーJSONデータの上書きインポート
                  </GalleryImportButton>
                  <CompatMendingThumbnailButton className="squared item text-left" />
                  <CompatGalleryButton
                    from="art"
                    to="main"
                    className="squared item text-left"
                  />
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
                <ModeSearchSwitch
                  toEnableTitle="全てのアルバムを表示する"
                  toDisableTitle="アルバム表示を元に戻す"
                  searchKey="showAllAlbum"
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
  const { pathname, state } = useLocation();
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
      state: { ...state, from: pathname },
      preventScrollReset: true,
      title: image.title || undefined,
    };
  }, [searchParams, image, state]);
  return (
    <Link
      className="item"
      {...toStatehandler()}
      onClick={
        onClick
          ? (e) => {
              e.preventDefault();
              onClick(image);
            }
          : undefined
      }
    >
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
      ) : image.embed ? (
        image.type === "material" ? (
          <div className="translucent-special-button">
            <MdMoveToInbox />
          </div>
        ) : image.type === "pdf" ? (
          <div className="translucent-special-button">
            <RiFilePdf2Fill />
          </div>
        ) : image.type === "3d" ? (
          <div className="translucent-special-button">
            <Md3dRotation />
          </div>
        ) : (
          <div className="translucent-special-button">
            <MdInsertDriveFile />
          </div>
        )
      ) : null}
      <ImageMeeThumbnail
        imageItem={image}
        loadingScreen={true}
        showMessage={true}
      />
    </Link>
  );
}

interface GalleryContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    GalleryBodyOptions {
  item: GalleryItemObjectType;
  list: ImageType[];
  ref?: React.RefObject<HTMLDivElement>;
}
function GalleryContent({
  item,
  list,
  className,
  showGalleryLabel,
  showCount,
  showGalleryHeader,
  showInPageMenu,
  ref,
  ...args
}: GalleryContentProps) {
  const [isComplete] = useDataIsComplete();
  let {
    name,
    linkLabel,
    h2,
    h4,
    label,
    max: maxFromArgs = 20,
    step = 20,
    maxWhenSearch = 40,
  } = item;
  const labelString = useMemo(() => label || name, [name, label]);
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q");
  const tags = searchParams.get("tags");
  const characters = searchParams.get("characters");
  const searchMode = useMemo(
    () => Boolean(q || tags || characters),
    [q, tags, characters]
  );
  const { state, search, hash } = useLocation();
  const nav = useNavigate();
  const isModal = searchParams.get("modal") === "gallery";
  const setSelectedImage = useSelectedImage()[1];
  const imageOnClick = isModal
    ? function (image: ImageType) {
        setSelectedImage(image);
      }
    : undefined;
  const [w] = useWindowSize();
  const max = useMemo(
    () => (searchMode ? maxWhenSearch : maxFromArgs),
    [maxFromArgs, maxWhenSearch, searchMode]
  );
  const curMax = useMemo(() => {
    let curMax = state?.galleryMax?.[name] ?? max;
    if (w >= 768) curMax = Math.ceil(curMax / 5) * 5;
    else curMax = Math.ceil(curMax / 4) * 4;
    return curMax;
  }, [name, max, state, w]);
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
    nav(
      { search, hash },
      {
        state: {
          ...state,
          ...{
            galleryMax: {
              ...state?.galleryMax,
              [name]: curMax + step,
            },
          },
        },
        replace: true,
        preventScrollReset: true,
      }
    );
  }, [nav, state, search, hash]);
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
      {isComplete ? (
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
      ) : (
        <div className="loadingNow text-main-soft my-4">よみこみちゅう…</div>
      )}
    </div>
  );
}

export function GalleryYearFilter({
  submitPreventScrollReset = true,
}: SearchAreaOptionsProps) {
  const { fList, items } = useGalleryObject();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = Number(searchParams.get("year") ?? NaN);
  const isOlder = searchParams.get("sort") === "leastRecently";
  const yearSelectRef = React.useRef<HTMLSelectElement>(null);
  const yearListBase = useMemo(
    () =>
      getYearObjects(
        fList
          .map((f, i) => (items[i].notYearList ? [] : f))
          .reduce((a, c) => {
            c.forEach(({ time }) => {
              if (time) a.push(time);
            });
            return a;
          }, [] as Date[])
      ),
    [fList, items]
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
    return addedList;
  }, [yearListBase, year]);
  const yearList = useMemo(() => {
    const olderSign = isOlder ? 1 : -1;
    const sortedList = yearListBase2.sort(
      (a, b) => olderSign * (a.year - b.year)
    );
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
  const { state } = useLocation();
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
          state,
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
}

const gallerySortTags = [
  defineSortTags(["leastResently", "nameOrder", "leastNameOrder"]),
];
export function GalleryTagsSelect(args: SelectAreaProps) {
  const isLogin = useIsLogin()[0];
  const searchParams = useSearchParams()[0];
  const filterParam = searchParams.get("filter");
  const likeWhere = useMemo(() => filterParam === "like", [filterParam]);
  const likeData = likeDataObject.useData()[0];
  const hasLikeChecked = useMemo(
    () =>
      Boolean(
        likeData?.some((v) => v.checked && v.path?.startsWith("?image="))
      ),
    [likeData]
  );
  const tags = useMemo(() => {
    const filterOptions: ContentsTagsOption[] = [];
    if (likeWhere || hasLikeChecked)
      filterOptions.push({ label: "♥️いいね済み", value: "filter:like" });
    return [
      ...gallerySortTags,
      {
        label: "フィルタ",
        name: "filter",
        options: filterOptions,
      },
      ...(isLogin ? addExtentionTagsOptions() : defaultGalleryTags),
    ];
  }, [isLogin, likeWhere, hasLikeChecked]);
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
  const characters = useCharacters()[0];
  const charaLabelOptions = useMemo(() => {
    let list = characters ?? [];
    if (enableCharaFilter) list = list.filter((v) => v.key !== currentChara!);
    return list.map((chara) => ({
      label: setCharaLangName(chara, lang),
      value: chara.key,
    }));
  }, [characters, currentChara, enableCharaFilter, lang]);
  const { state } = useLocation();
  const value = useMemo(() => {
    const list = searchParams.get("characters")?.split(",");
    return charaLabelOptions.filter(({ value }) =>
      list?.some((item) => item === value)
    );
  }, [searchParams, charaLabelOptions]);
  const charactersMap = useCharactersMap()[0];
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
          state,
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
  const [selectedImage, setSelectedImage] = useSelectedImage();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const enable = searchParams.get("modal") === "gallery";
  function closeHandler() {
    if (state?.from) {
      delete state.from;
      nav(-1);
    } else {
      searchParams.delete("modal");
      setSearchParams(searchParams, { state, preventScrollReset: true });
    }
  }
  useEffect(() => {
    if (selectedImage) {
      setSelectedImage(null);
      closeHandler();
    }
  }, [selectedImage, setSelectedImage]);
  return (
    <>
      {enable ? (
        <Modal
          classNameEntire="gallery"
          className="window miniGallery"
          onClose={closeHandler}
        >
          <GalleryPage showInPageMenu={false} hideWhenEmpty={true} />
        </Modal>
      ) : null}
    </>
  );
}
