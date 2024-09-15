import {
  Link,
  To,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { imageAlbumsAtom, imagesAtom } from "@/state/ImageState";
import { useAtom } from "jotai";
import { dataIsCompleteAtom } from "@/state/StateSet";
import React, {
  ReactNode,
  createRef,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  defaultGalleryFilterTags,
  defineSortTags,
  defaultGalleryTags,
  filterGalleryMonthList,
} from "@/components/dropdown/SortFilterTags";
import {
  filterImagesTags,
  filterPickFixed,
} from "../data/functions/FilterImages";
import { create } from "zustand";
import { InPageMenu } from "@/layout/InPageMenu";
import { useDropzone } from "react-dropzone";
import { RiBook2Fill, RiFilePdf2Fill, RiStore3Fill } from "react-icons/ri";
import { ImageMeeShowOriginSwitch, ImageMeeThumbnail } from "@/layout/ImageMee";
import MoreButton from "../components/svg/button/MoreButton";
import { getJSTYear } from "../data/functions/TimeFunctions";
import { MdFileDownload, MdFileUpload } from "react-icons/md";
import { findMee, setWhere } from "@/functions/findMee";
import { useHotkeys } from "react-hotkeys-hook";
import { ContentsTagsSelect } from "@/components/dropdown/SortFilterReactSelect";
import useWindowSize from "@/components/hook/useWindowSize";
import { useImageViewer } from "@/state/ImageViewer";
import { ImageGlobalEditModeSwitch, ImagesUpload } from "./edit/ImageEditForm";
import { ApiOriginAtom, EnvAtom, isLoginAtom } from "@/state/EnvState";
import { RbButtonArea } from "@/components/dropdown/RbButtonArea";
import { fileDialog, fileDownload } from "@/components/FileTool";
import { imageDataObject, ImportImagesJson } from "@/state/DataState";
import { charactersAtom, charactersMapAtom } from "@/state/CharacterState";
import ReactSelect from "react-select";
import { callReactSelectTheme } from "@/theme/main";
import { TbDatabaseImport } from "react-icons/tb";
import { BiPhotoAlbum } from "react-icons/bi";
import { charaTagsLabel } from "@/components/FormatOptionLabel";

export function GalleryPage({ children }: { children?: ReactNode }) {
  const [env] = useAtom(EnvAtom);
  const galleryList =
    env?.IMAGE_ALBUMS?.map((album) => ({
      ...album.gallery?.pages,
      ...album,
    })).filter((v) => v) ?? [];
  const [isComplete] = useAtom(dataIsCompleteAtom);
  return (
    <div id="galleryPage">
      <GalleryManageMenuButton />
      {children}
      {isComplete ? <GalleryObjectConvert items={galleryList} /> : null}
    </div>
  );
}

export function GalleryManageMenuButton({ group }: { group?: string }) {
  const isLogin = useAtom(isLoginAtom)[0];
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const setImagesLoad = useAtom(imageDataObject.loadAtom)[1];
  const charactersMap = useAtom(charactersMapAtom)[0];
  const params = useParams();
  return (
    <>
      {isLogin ? (
        <RbButtonArea
          dropdown={
            <>
              <button
                type="button"
                className="round large"
                title="ダウンロードする"
                onClick={async () => {
                  fileDownload(
                    imageDataObject.storage.key + ".json",
                    JSON.stringify(imageDataObject.storage)
                  );
                }}
              >
                <MdFileDownload />
              </button>
              <button
                type="button"
                className="round large"
                title="ギャラリーデータベースのインポート"
                onClick={() => {
                  ImportImagesJson({ apiOrigin, charactersMap }).then(() => {
                    setImagesLoad("no-cache-reload");
                  });
                }}
              >
                <TbDatabaseImport />
              </button>
            </>
          }
        >
          <button
            type="button"
            className="round large"
            title="アップロードする"
            onClick={() => {
              fileDialog("image/*", true)
                .then((files) => Array.from(files))
                .then((files) =>
                  ImagesUpload({
                    src: files,
                    apiOrigin,
                    character: params.charaName,
                    album: group,
                  })
                )
                .then(() => {
                  setImagesLoad("no-cache");
                });
            }}
          >
            <MdFileUpload />
          </button>
        </RbButtonArea>
      ) : null}
    </>
  );
}

export function GalleryGroupPage({}: SearchAreaOptionsProps) {
  const { group } = useParams();
  const [env] = useAtom(EnvAtom);
  const album = useMemo(
    () =>
      env?.IMAGE_ALBUMS?.find(
        (album) => (typeof album === "string" ? album : album.name) === group
      ),
    [group, env]
  );
  const items = album ? { ...album?.gallery?.generate, ...album } : undefined;
  return (
    <>
      <GalleryManageMenuButton group={group} />
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
  const images = useAtom(imagesAtom)[0];
  const imageAlbums = useAtom(imageAlbumsAtom)[0];
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
    />
  );
}

export const useGalleryObject = create<GalleryObjectType>((set) => ({
  items: [],
  fList: [],
  yfList: [],
  setItems(items) {
    set({ items });
  },
  setYFList(fList, yfList) {
    set({ fList, yfList });
  },
}));

export function GalleryObject({ items: _items, ...args }: GalleryObjectProps) {
  const searchParams = useSearchParams()[0];
  const sortParam = searchParams.get("sort");
  const filterParam = searchParams.get("filter");
  const typeParam = searchParams.get("type");
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const qParam = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags")?.toLowerCase();
  const charactersParam = searchParams.get("characters"?.toLowerCase());
  const filterParams = useMemo(
    () => (filterParam ?? "").split(","),
    [filterParam]
  );
  const topicParams = useMemo(
    () => filterParams.filter((p) => p === "topImage" || p === "pickup"),
    [filterParams]
  );
  const searchMode = useMemo(
    () => Boolean(qParam || tagsParam || charactersParam),
    [qParam, tagsParam || charactersParam]
  );
  const year = Number(yearParam);
  const monthlyEventMode = useMemo(
    () => !filterParams.some((p) => p === "monthTag"),
    [filterParams]
  );
  const filterMonthly = useMemo(
    () =>
      filterGalleryMonthList.find(({ month }) => String(month) === monthParam),
    [monthParam]
  );
  const showAllAlbum = searchParams.has("showAllAlbum");
  const items = useMemo(() => {
    if (showAllAlbum)
      return _items.map((item) => ({
        ...item,
        hideWhenEmpty: false,
        hide: false,
      }));
    else return _items;
  }, [_items, showAllAlbum]);
  const { setItems, setYFList } = useGalleryObject(
    useCallback(({ setItems, setYFList }) => ({ setItems, setYFList }), [items])
  );

  const { where, orderBy } = useMemo(
    () =>
      setWhere<ImageType>(qParam, {
        text: {
          key: [
            "tags",
            "characters",
            "copyright",
            "name",
            "description",
            "URL",
            "embed",
          ],
        },
        hashtag: { key: ["tags", "characters"] },
      }),
    [qParam]
  );
  const tagsWhere = useMemo(
    () =>
      tagsParam
        ?.split(",")
        ?.map(
          (value) => ({ tags: { contains: value } } as findWhereType<ImageType>)
        ),
    [tagsParam]
  );
  const charactersWhere = useMemo(
    () =>
      charactersParam
        ?.split(",")
        ?.map(
          (value) =>
            ({ characters: { contains: value } } as findWhereType<ImageType>)
        ),
    [charactersParam]
  );
  let wheres = useMemo(() => {
    const wheres = [where];
    if (tagsWhere) wheres.push(...tagsWhere);
    if (charactersWhere) wheres.push(...charactersWhere);
    return wheres;
  }, [where, tagsWhere, charactersWhere]);
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
        list.push({ name: "asc" });
        break;
      case "leastNameOrder":
        list.push({ name: "desc" });
        break;
    }
    const keys = list.reduce((a, c) => {
      Object.keys(c).forEach((v) => a.push(v));
      return a;
    }, [] as string[]);
    if (keys.every((key) => key !== "time")) list.unshift({ time: "desc" });
    if (keys.every((key) => key !== "name")) list.unshift({ name: "asc" });
    return list;
  }, [sortParam, orderBy]);

  const { fList, yfList } = useMemo(() => {
    const fList = items
      .map((item) =>
        item.hide ||
        (!searchMode && item.hideWhenDefault) ||
        (item.hideWhenFilter &&
          (searchMode || topicParams.length > 0 || typeParam || monthParam))
          ? []
          : item.list ?? []
      )
      .map((images) => {
        if (filterMonthly) {
          if (monthlyEventMode) {
            images = filterImagesTags({
              images,
              tags: filterMonthly.tags,
              every: false,
            });
          } else {
            images = filterImagesTags({
              images,
              tags: filterMonthly.tags.filter((v, i) => i === 0),
            });
          }
        }
        topicParams.forEach((p) => {
          images = images.filter((image) => image[p]);
        });
        if (typeParam) images = images.filter(({ type }) => type === typeParam);
        images = findMee({
          list: [...images],
          where: { AND: wheres },
          orderBy: orderBySort,
        });
        return images;
      });
    const yfList = fList.map((images) => {
      if (year)
        images = images.filter((item) => getJSTYear(item.time) === year);
      return images;
    });
    return { fList, yfList };
  }, [
    items,
    topicParams,
    searchMode,
    typeParam,
    monthParam,
    filterMonthly,
    wheres,
    orderBySort,
    year,
  ]);
  useLayoutEffect(() => {
    setYFList(fList, yfList);
  }, [fList, yfList]);
  useLayoutEffect(() => {
    setItems(items);
  }, [items]);
  return <GalleryBody items={items} yfList={yfList} {...args} />;
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
  const apiOrigin = useAtom(ApiOriginAtom)[0];
  const setImagesLoad = useAtom(imageDataObject.loadAtom)[1];
  const character = useParams().charaName;
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const now = new Date();
      const nowTime = now.getTime();
      const list = acceptedFiles.filter(
        (f) => Math.abs(nowTime - f.lastModified) > 10
      );
      ImagesUpload({
        src: list,
        apiOrigin,
        character,
        ...(item
          ? {
              album: item.name,
              tags: item.tags,
              character: item.character,
            }
          : undefined),
      }).then(() => {
        setImagesLoad("no-cache");
      });
    },
    [item, character]
  );
  const { getRootProps, getInputProps, isDragAccept } = useDropzone({
    onDrop,
    noClick: typeof enableOnClick === "boolean" ? !enableOnClick : true,
  });
  const classNameMemo = useMemo(() => {
    const list = ["dropzone"];
    if (className) list.push(className);
    if (isDragAccept) list.push("isDrag");
    if (enableOnClick) list.push("pointer");
    return list.join(" ");
  }, [className, isDragAccept, enableOnClick]);
  return (
    <>
      <div {...getRootProps()} className={classNameMemo}>
        <input
          name="upload"
          id={item ? "upload_" + item.name : undefined}
          {...getInputProps({ accept: "image/*" })}
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
  const args = {
    showInPageMenu,
    showGalleryHeader,
    showGalleryLabel,
    showCount,
  };
  const isLogin = useAtom(isLoginAtom)[0];
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
      {showInPageMenu ? <InPageMenu list={inPageList} adjust={64} /> : null}
      <div>
        {showGalleryHeader ? (
          <div className="header">
            <div className="icons">
              {isLogin ? (
                <>
                  <ImageMeeShowOriginSwitch />
                  <ImageGlobalEditModeSwitch />
                  <ShowAllAlbumSwitch />
                </>
              ) : null}
            </div>
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
}: {
  galleryName?: string;
  image: ImageType;
}) {
  const { pathname, state } = useLocation();
  const [searchParams] = useSearchParams();
  const toStatehandler = useCallback((): {
    to: To;
    state?: any;
    preventScrollReset?: boolean;
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
    };
  }, [searchParams, image, state]);
  return (
    <Link className="item" {...toStatehandler()}>
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
      ) : null}
      {image.embed ? (
        image.type === "pdf" ? (
          <div className="translucent-special-button">
            <RiFilePdf2Fill />
          </div>
        ) : null
      ) : null}
      <ImageMeeThumbnail imageItem={image} loadingScreen={true} />
    </Link>
  );
}

interface GalleryContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    GalleryBodyOptions {
  item: GalleryItemObjectType;
  list: ImageType[];
}
const GalleryContent = forwardRef<HTMLDivElement, GalleryContentProps>(
  function GalleryContent(
    {
      item,
      list,
      className,
      showGalleryLabel,
      showCount,
      showGalleryHeader,
      showInPageMenu,
      ...args
    },
    ref
  ) {
    const [isComplete] = useAtom(dataIsCompleteAtom);
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
    const { state } = useLocation();
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
    const GalleryContent = useMemo(
      () =>
        isComplete ? (
          <div className="list">
            {list
              .filter((_, i) => i < visibleMax)
              .map((image, i) => (
                <GalleryImageItem image={image} galleryName={name} key={i} />
              ))}
            {showMoreButton ? (
              <Link
                to={location.href}
                state={{
                  ...state,
                  ...{
                    galleryMax: {
                      ...state?.galleryMax,
                      [name]: curMax + step,
                    },
                  },
                }}
                preventScrollReset={true}
                replace={true}
                title="もっと見る"
                className="item"
              >
                <MoreButton className="gallery-button-more" />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="loadingNow text-main-soft my-4">よみこみちゅう…</div>
        ),
      [isComplete, list, visibleMax, curMax, step, showMoreButton, state]
    );
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
        {GalleryContent}
      </div>
    );
  }
);

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
    const sortedList = isOlder
      ? yearListBase2.sort((a, b) => a.year - b.year)
      : yearListBase2.sort((a, b) => b.year - a.year);
    const count = sortedList.reduce((a, c) => a + c.count, 0);
    sortedList.unshift({
      year: 0,
      count,
      label: `all (${count})`,
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
      className="yearFilter"
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
    .map((date) => getJSTYear(date))
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
  const isLogin = useAtom(isLoginAtom)[0];
  const tags = gallerySortTags.concat(
    isLogin ? defaultGalleryFilterTags : [],
    defaultGalleryTags
  );
  return <ContentsTagsSelect {...args} tags={tags} />;
}
export function GalleryCharactersSelect({
  submitPreventScrollReset,
  className,
}: SelectAreaProps) {
  const params = useParams();
  const currentChara = params["charaName"];
  const characters = useAtom(charactersAtom)[0];
  const charaLabelOptions = useMemo(() => {
    let list = characters ?? [];
    if (currentChara) list = list.filter((v) => v.key !== currentChara);
    return list.map(({ name, key: id }) => ({
      label: name,
      value: id,
    }));
  }, [characters, currentChara]);
  const [searchParams, setSearchParams] = useSearchParams();
  const value = useMemo(() => {
    const list = searchParams.get("characters")?.split(",");
    return charaLabelOptions.filter(({ value }) =>
      list?.some((item) => item === value)
    );
  }, [searchParams, charaLabelOptions]);
  const charactersMap = useAtom(charactersMapAtom)[0];
  const charaFormatOptionLabel = useMemo(() => {
    if (charactersMap) return charaTagsLabel(charactersMap);
  }, [charactersMap]);
  return (
    <ReactSelect
      options={charaLabelOptions}
      formatOptionLabel={charaFormatOptionLabel}
      isMulti
      isSearchable={false}
      isLoading={!Boolean(characters)}
      classNamePrefix="select"
      placeholder={(currentChara ? "他の" : "") + "キャラクター"}
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
        setSearchParams(searchParams, { preventScrollReset: true });
      }}
    />
  );
}

export function ShowAllAlbumSwitch() {
  const searchParams = useSearchParams()[0];
  const key = "showAllAlbum";
  const [showAllAlbum, href] = useMemo(() => {
    const has = searchParams.has(key);
    if (has) searchParams.delete(key);
    else searchParams.set(key, "on");
    return [has, searchParams.size ? "?" + searchParams.toString() : ""];
  }, [key, searchParams]);
  return (
    <Link
      title={
        showAllAlbum ? "アルバム表示を元に戻す" : "全てのアルバムを表示する"
      }
      style={{ opacity: showAllAlbum ? 1 : 0.4 }}
      to={href}
      replace={true}
      preventScrollReset={true}
    >
      <BiPhotoAlbum />
    </Link>
  );
}
