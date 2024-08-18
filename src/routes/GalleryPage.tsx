import {
  Link,
  To,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useImageState } from "@/state/ImageState";
import SiteConfigList from "@/data/config.list";
import { useAtom } from "jotai";
import { dataIsCompleteAtom } from "@/state/StateSet";
import React, {
  HTMLAttributes,
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
import toast from "react-hot-toast";
import axios from "axios";
import { RiBook2Fill, RiFilePdf2Fill, RiStore3Fill } from "react-icons/ri";
import { ImageMeeThumbnail } from "@/layout/ImageMee";
import MoreButton from "../components/svg/button/MoreButton";
import { getJSTYear } from "../data/functions/TimeFunctions";
import { MdFileUpload } from "react-icons/md";
import { findMany, setWhere } from "@/functions/findMany";
import { useHotkeys } from "react-hotkeys-hook";
import { AiFillEdit, AiOutlineFileImage } from "react-icons/ai";
import { ContentsTagsSelect } from "@/components/dropdown/SortFilterReactSelect";
import useWindowSize from "@/components/hook/useWindowSize";
import { CgGhostCharacter } from "react-icons/cg";
import { useImageViewer } from "@/state/ImageViewer";
import { imageEditIsEditHold } from "./edit/ImageEditForm";

export function GalleryPage({ children }: { children?: ReactNode }) {
  const galleryList = SiteConfigList.gallery.list;
  const [isComplete] = useAtom(dataIsCompleteAtom);
  return (
    <div id="galleryPage">
      {children}
      {isComplete ? <GalleryObjectConvert items={galleryList} /> : null}
    </div>
  );
}

export function GalleryGroupPage({}: SearchAreaOptionsProps) {
  const { group } = useParams();
  const UploadElm = useCallback(
    () =>
      import.meta.env.DEV && group ? (
        <div className="rbButtonArea z30">
          <button
            type="button"
            className="round large"
            title="アップロードする"
            onClick={() => {
              const uploadElm = document.querySelector(`input[name="upload"]`);
              if (uploadElm) (uploadElm as HTMLInputElement).click();
            }}
          >
            <MdFileUpload />
          </button>
        </div>
      ) : (
        <></>
      ),
    [group]
  );
  const items = useMemo(
    () =>
      SiteConfigList.gallery.generate.find(
        (_group) =>
          (typeof _group === "string" ? _group : _group.name) === group
      ) || group,
    [group]
  );
  return (
    <>
      {import.meta.env.DEV && group ? <UploadElm /> : null}
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
  const { imageItemList, imageAlbumList } = useImageState().imageObject;
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
                  list: filterPickFixed({ images: imageItemList, name }),
                  label: item.label ?? item.name,
                  max: item.max ?? 20,
                  linkLabel: item.linkLabel ?? false,
                  hideWhenFilter: true,
                  hideWhenEmpty: true,
                };
              default:
                const album = imageAlbumList.find(
                  (album) => album.name === name
                );
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
    [items, imageItemList, imageAlbumList]
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
  const [searchParams] = useSearchParams();
  const {
    sort: sortParam,
    filter: filterParam,
    type: typeParam,
    year: yearParam,
    month: monthParam,
    q: qParam,
    tag: tagParam,
  } = Object.fromEntries(searchParams) as KeyValueType<string>;
  const filterParams = useMemo(
    () => (filterParam ?? "").split(","),
    [filterParam]
  );
  const topicParams = useMemo(
    () => filterParams.filter((p) => p === "topImage" || p === "pickup"),
    [filterParams]
  );
  const searchMode = useMemo(
    () => Boolean(qParam || tagParam),
    [qParam, tagParam]
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
  const notHideParam = useMemo(
    () => filterParams.some((p) => p === "notHide"),
    [filterParams]
  );
  const items = useMemo(() => {
    if (notHideParam)
      return _items.map((item) => ({
        ...item,
        hideWhenEmpty: false,
        hide: false,
      }));
    else return _items;
  }, [_items, notHideParam]);
  const { setItems, setYFList } = useGalleryObject(
    useCallback(({ setItems, setYFList }) => ({ setItems, setYFList }), [items])
  );

  const tags = useMemo(() => tagParam?.split(","), [tagParam]);
  const { where, orderBy } = useMemo(
    () =>
      setWhere(qParam, {
        text: {
          key: ["tags", "copyright", "name", "description", "URL", "embed"],
        },
        hashtag: { key: "tags" },
      }),
    [qParam]
  );

  const orderBySort = useMemo(() => {
    const list: OrderByItem<MediaImageItemType>[] = [...orderBy];
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
          (topicParams.length > 0 || typeParam || tags || monthParam))
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
        if (tags)
          images = filterImagesTags({
            images,
            tags,
          });
        images = findMany({ list: [...images], where, orderBy: orderBySort });
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
    tags,
    where,
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
  item,
  children,
}: {
  item: GalleryItemObjectType;
  children?: ReactNode;
}) {
  const { imageObject, setImageFromUrl } = useImageState();
  const { imageItemList, imageAlbumList } = imageObject;
  const tags = useMemo(
    () => (typeof item.tags === "string" ? [item.tags] : item.tags),
    [item.tags]
  );
  const getAlbum = useCallback(
    (name: string) => {
      return imageAlbumList.find((album) => album.name === name);
    },
    [imageAlbumList]
  );
  const upload = useCallback(
    (files: File[]) => {
      const album = item.name ? getAlbum(item.name) : null;
      if (!album) return false;
      const checkTime = new Date().getTime();
      const targetFiles = files.filter((file) => {
        const findFunc = ({ src, originName }: MediaImageItemType) =>
          [src, originName].some((n) => n === file.name);
        const fromBrowser = Math.abs(checkTime - file.lastModified) < 200;
        if (fromBrowser) {
          return !imageItemList.some(findFunc);
        } else {
          const existTime = album.list.find(findFunc)?.time?.getTime();
          if (!existTime) return true;
          return (
            Math.floor(existTime / 1000) !==
            Math.floor(file.lastModified / 1000)
          );
        }
      });
      if (targetFiles.length === 0) return false;
      const formData = new FormData();
      formData.append("dir", album.dir || "");
      tags?.forEach((tag) => {
        formData.append("tags[]", tag);
      });
      targetFiles.forEach((file) => {
        formData.append("attached[]", file);
        if (file.lastModified)
          formData.append("attached_mtime[]", String(file.lastModified));
      });
      axios.post("/gallery/send", formData).then((res) => {
        if (res.status === 200) {
          toast("アップロードしました！", {
            duration: 2000,
          });
          setTimeout(() => {
            setImageFromUrl();
          }, 200 + 200 * targetFiles.length);
        }
      });
    },
    [tags]
  );
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const now = new Date();
      const nowTime = now.getTime();
      const list = acceptedFiles.filter(
        (f) => Math.abs(nowTime - f.lastModified) > 10
      );
      upload(list);
    },
    [upload]
  );
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <>
      <div {...getRootProps()}>
        <input name="upload" {...getInputProps()} />
        {children}
      </div>
    </>
  );
}

interface GalleryBodyProps extends GalleryBodyOptions {
  items: GalleryItemObjectType[];
  yfList: MediaImageItemType[][];
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
  const SearchAreaOptions = { submitPreventScrollReset };
  return (
    <div id="galleryPage">
      {showInPageMenu ? <InPageMenu list={inPageList} adjust={64} /> : null}
      <div>
        {showGalleryHeader ? (
          <div className="header">
            <div className="icons">
              {import.meta.env.DEV ? (
                <>
                  <GalleryPageDevOtherSwitch />
                  <GalleryPageOriginImageSwitch />
                  <GalleryPageEditSwitch />
                </>
              ) : null}
            </div>
            <GalleryYearFilter {...SearchAreaOptions} />
            <GallerySearchArea {...SearchAreaOptions} />
            <GalleryTagsSelect {...SearchAreaOptions} />
          </div>
        ) : null}
        {items
          .map((item, i) => ({ ...item, i }))
          .filter(({ hideWhenEmpty = true, i }) =>
            hideWhenEmpty ? yfList[i].length : true
          )
          .map(({ i, ...item }) => (
            <div key={i}>
              {import.meta.env.DEV ? (
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
          ))}
      </div>
    </div>
  );
}

function GalleryImageItem({
  galleryName,
  image,
}: {
  galleryName?: string;
  image: MediaImageItemType;
}) {
  const { pathname, state } = useLocation();
  const { showOrigin } = useMemo(() => state ?? {}, [state]);
  const isOrigin = useMemo(() => showOrigin === "on", [showOrigin]);
  const [searchParams] = useSearchParams();
  const toStatehandler = useCallback((): {
    to: To;
    state?: any;
    preventScrollReset?: boolean;
  } => {
    if (image.direct) return { to: image.direct };
    if (image.originName) searchParams.set("image", image.originName);
    if (galleryName && image.album?.name !== galleryName)
      searchParams.set("group", galleryName);
    else if (image.album?.name) searchParams.set("album", image.album.name);
    return {
      to: new URL("?" + searchParams.toString(), location.href).href,
      state: { ...state, from: pathname },
      preventScrollReset: true,
    };
  }, [searchParams, image, state]);
  return (
    <Link className="item" {...toStatehandler()}>
      <div>
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
        <ImageMeeThumbnail
          imageItem={image}
          loadingScreen={true}
          originWhenDev={isOrigin}
        />
      </div>
    </Link>
  );
}

interface GalleryContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    GalleryBodyOptions {
  item: GalleryItemObjectType;
  list: MediaImageItemType[];
}
const GalleryContent = forwardRef<HTMLDivElement, GalleryContentProps>(
  function GalleryContent(
    {
      item,
      list,
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
    const [searchParams] = useSearchParams();
    const { q, tag } = Object.fromEntries(searchParams) as KeyValueType<string>;
    const searchMode = useMemo(() => Boolean(q || tag), [q, tag]);
    const nav = useNavigate();
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
    function setCurMax(name: string, max: number) {
      const newState = state ? { ...state } : {};
      if (!("galleryMax" in newState)) newState.galleryMax = {};
      newState.galleryMax[name] = max;
      nav(location, {
        state: newState,
        preventScrollReset: true,
        replace: true,
      });
    }
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
            <h2>
              <HeadingElm label={label} />
            </h2>
            {showCount ? <div className="count">({list.length})</div> : null}
          </div>
        ) : null,
      [showGalleryLabel, label, list.length, showCount]
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
              <div className="item">
                <MoreButton
                  className="gallery-button-more"
                  onClick={() => {
                    setCurMax(name, curMax + step);
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="loadingNow text-main-soft my-4">よみこみちゅう…</div>
        ),
      [isComplete, list, visibleMax, curMax, step, showMoreButton]
    );
    return (
      <div {...args} ref={ref}>
        {h2 || h4 ? (
          <div className="galleryLabel outLabel">
            {h2 ? <h2>{h2}</h2> : null}
            {h4 ? <h4>{h4}</h4> : null}
          </div>
        ) : null}
        <div className="galleryContainer">
          {GalleryLabel}
          {GalleryContent}
        </div>
      </div>
    );
  }
);

export function GalleryYearFilter({
  submitPreventScrollReset = true,
}: SearchAreaOptionsProps) {
  const { fList } = useGalleryObject(({ fList }) => ({ fList }));
  const [searchParams, setSearchParams] = useSearchParams();
  const year = Number(searchParams.get("year") ?? NaN);
  const isOlder = searchParams.get("sort") === "leastRecently";
  const yearSelectRef = React.useRef<HTMLSelectElement>(null);
  const yearListBase = useMemo(
    () =>
      getYearObjects(
        fList.reduce((a, c) => {
          c.forEach(({ time }) => {
            if (time) a.push(time);
          });
          return a;
        }, [] as Date[])
      ),
    [fList]
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

interface SelectAreaProps
  extends HTMLAttributes<HTMLDivElement>,
    SearchAreaOptionsProps {}

const gallerySortTags = [
  defineSortTags(["leastResently", "nameOrder", "leastNameOrder"]),
];
export function GalleryTagsSelect(args: SelectAreaProps) {
  const tags = gallerySortTags.concat(
    import.meta.env.DEV ? defaultGalleryFilterTags : [],
    defaultGalleryTags
  );
  return <ContentsTagsSelect {...args} tags={tags} />;
}

export function GalleryPageDevOtherSwitch() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const q = searchParams.get("q");
  const targetCharacterId = useMemo(() => q?.match(/^#(\w+)$/)?.[1], [q]);
  return (
    <>
      {targetCharacterId ? (
        <button
          type="button"
          title={targetCharacterId + "で新しくキャラを作る"}
          onClick={() => {
            nav("/character/" + targetCharacterId + "?edit=on");
          }}
        >
          <CgGhostCharacter />
        </button>
      ) : null}
    </>
  );
}

export function GalleryPageEditSwitch() {
  const [isEditHold, setIsEditHold] = useAtom(imageEditIsEditHold);
  return (
    <button
      title={isEditHold ? "元に戻す" : "常に編集モードにする"}
      type="button"
      onClick={() => {
        setIsEditHold(!isEditHold);
      }}
      style={{ opacity: isEditHold ? 1 : 0.4 }}
    >
      <AiFillEdit />
    </button>
  );
}

export function GalleryPageOriginImageSwitch() {
  const state = useLocation().state ?? {};
  const { showOrigin } = state;
  const isOrigin = useMemo(() => showOrigin === "on", [showOrigin]);
  const stateHandler = useCallback(() => {
    const _state = { ...state };
    if (isOrigin) delete _state.showOrigin;
    else _state.showOrigin = "on";
    return _state;
  }, [state]);
  return (
    <Link
      title={isOrigin ? "元に戻す" : "画像を元のファイルで表示する"}
      state={stateHandler()}
      style={{ opacity: isOrigin ? 1 : 0.4 }}
      to={location.search}
      replace={true}
      preventScrollReset={true}
    >
      <AiOutlineFileImage />
    </Link>
  );
}
