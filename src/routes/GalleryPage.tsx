import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useImageState } from "@/state/ImageState";
import SiteConfigList from "@/data/config.list";
import { useDataState } from "@/state/StateSet";
import {
  ReactNode,
  createRef,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { filterMonthList } from "../components/tag/GalleryTags";
import {
  filterImagesTags,
  filterPickFixed,
} from "../data/functions/FilterImages";
import { create } from "zustand";
import { InPageMenu } from "@/layout/InPageMenu";
import {
  GalleryYearFilter,
  GallerySearchArea,
  GalleryTagsSelect,
  GalleryPageEditSwitch,
  GalleryPageOriginImageSwitch,
} from "../components/tag/GalleryFormSet";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axios from "axios";
import { LinkMee, MakeRelativeURL } from "@/functions/doc/MakeURL";
import { RiBook2Fill, RiFilePdf2Fill, RiStore3Fill } from "react-icons/ri";
import { ImageMeeThumbnail } from "@/layout/ImageMee";
import MoreButton from "../components/svg/button/MoreButton";
import { getJSTYear } from "../data/functions/TimeFunctions";
import { MdFileUpload } from "react-icons/md";

export function GalleryPage({ children }: { children?: ReactNode }) {
  return (
    <div className="galleryPage">
      <GalleryPageMain />
      {children}
    </div>
  );
}

function GalleryPageMain() {
  const galleryList = SiteConfigList.gallery.list;
  const { isComplete } = useDataState();
  if (!isComplete) return <></>;
  return <GalleryObjectConvert items={galleryList} />;
}

export function GalleryGroupPage() {
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

interface GalleryObjectConvertProps extends GalleryListPropsBase {
  items?: GalleryItemsType;
}

export function GalleryObjectConvert({
  items,
  ...args
}: GalleryObjectConvertProps) {
  const { imageItemList, imageAlbumList } = useImageState();
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

  return <GalleryObject items={albums} />;
}

interface searchesType {
  key: string;
  value: string;
  reg?: RegExp;
  option?: string;
}

interface sortObjectType {
  key: string;
  order: "asc" | "desc";
}

interface GalleryObjectType {
  items: GalleryItemObjectType[];
  fList: MediaImageItemType[][];
  yfList: MediaImageItemType[][];
  setItems: (items: GalleryItemObjectType[]) => void;
  setYFList: (
    fList: MediaImageItemType[][],
    yfList: MediaImageItemType[][]
  ) => void;
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

interface GalleryBodyOptions {
  showInPageMenu?: boolean;
  showGalleryHeader?: boolean;
  showGalleryLabel?: boolean;
  showCount?: boolean;
}
interface GalleryObjectProps extends GalleryBodyOptions {
  items: GalleryItemObjectType[];
}

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
  const year = Number(yearParam);
  const monthlyEventMode = useMemo(
    () => !filterParams.some((p) => p === "monthTag"),
    [filterParams]
  );
  const filterMonthly = useMemo(
    () => filterMonthList.find(({ month }) => String(month) === monthParam),
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
      }));
    else return _items;
  }, [_items, notHideParam]);
  const { setItems, setYFList } = useGalleryObject(
    useCallback(({ setItems, setYFList }) => ({ setItems, setYFList }), [items])
  );

  const sortList = useMemo(() => {
    const list: sortObjectType[] = [];
    const searchSort = sortParam ?? "";
    switch (searchSort) {
      case "recently":
        list.push({ key: "time", order: "desc" });
        break;
      case "leastRecently":
        list.push({ key: "time", order: "asc" });
        break;
      case "nameOrder":
        list.push({ key: "name", order: "asc" });
        break;
      case "leastNameOrder":
        list.push({ key: "name", order: "desc" });
        break;
    }
    if (list.every(({ key }) => key !== "time"))
      list.unshift({ key: "time", order: "desc" });
    if (list.every(({ key }) => key !== "name"))
      list.unshift({ key: "name", order: "asc" });
    return list;
  }, [sortParam]);
  const tags = useMemo(() => tagParam?.split(","), [tagParam]);
  const searches = useMemo(
    () =>
      qParam?.split(" ", 3).map((q) => {
        const qs = q.split(":");
        if (qs.length === 1 && qs[0].startsWith("#"))
          return {
            key: "hashtag",
            value: qs[0].slice(1),
            reg: new RegExp(`${qs[0]}(\\s|$)`, "i"),
          } as searchesType;
        else {
          const key = qs.length > 1 ? qs[0] : "keyword";
          const value = qs.length > 1 ? qs[1] : qs[0];
          const option = qs.length > 2 ? qs[2] : undefined;
          return { key, value, option } as searchesType;
        }
      }),
    [qParam]
  );

  const { fList, yfList } = useMemo(() => {
    const fList = items
      .map((item) =>
        item.hideWhenFilter &&
        (topicParams.length > 0 || typeParam || tags || searches || monthParam)
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

        if (searches)
          images = images.filter((image) => {
            const ImageDataStr = [
              image.name,
              image.description,
              image.src,
              image.copyright,
            ]
              .concat(image.tags)
              .join(" ");
            return searches.every(({ key, value, option, reg }) => {
              switch (key) {
                case "tag":
                case "hashtag":
                  let result = false;
                  if (key === "hashtag" && image.description)
                    result = Boolean(reg?.test(image.description));
                  return (
                    result ||
                    image.tags?.some((tag) => {
                      switch (option) {
                        case "match":
                          return tag.match(value);
                        default:
                          return tag === value;
                      }
                    })
                  );
                case "name":
                case "description":
                case "URL":
                case "copyright":
                case "embed":
                  const imageValue = image[key];
                  if (imageValue) return imageValue.match(value);
                  else return false;
                default:
                  return ImageDataStr.match(value);
              }
            });
          });
        return images;
      });
    const yfList = fList.map((images) => {
      if (year)
        images = images.filter((item) => getJSTYear(item.time) === year);
      sortList.forEach(({ key, order }) => {
        switch (key) {
          case "time":
            images.sort((a, b) => {
              const atime = a.time?.getTime() || 0;
              const btime = b.time?.getTime() || 0;
              if (atime === btime) return 0;
              else {
                const result = atime > btime;
                return (order === "asc" ? result : !result) ? 1 : -1;
              }
            });
            break;
          default:
            images.sort((a, b) => {
              if (a[key] === b[key]) return 0;
              const result = a[key] > b[key];
              return (order === "asc" ? result : !result) ? 1 : -1;
            });
        }
      });
      return images;
    });
    return { fList, yfList };
  }, [
    items,
    topicParams,
    typeParam,
    monthParam,
    filterMonthly,
    tags,
    searches,
    sortList,
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
  const { imageItemList, imageAlbumList, setImageFromUrl } = useImageState();
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
  const upload = useCallback((files: File[]) => {
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
          Math.floor(existTime / 1000) !== Math.floor(file.lastModified / 1000)
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
  }, []);
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
  return (
    <div className="galleryObject">
      {showInPageMenu ? <InPageMenu list={inPageList} adjust={64} /> : null}
      <div>
        {showGalleryHeader ? (
          <div className="galleryHeader">
            {import.meta.env.DEV ? (
              <>
                <GalleryPageOriginImageSwitch />
                <GalleryPageEditSwitch />
              </>
            ) : null}
            <GalleryYearFilter />
            <GallerySearchArea />
            <GalleryTagsSelect />
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
    const { isComplete } = useDataState();
    const { name, linkLabel, h2, h4, label, max = 20, step = 20 } = item;
    const { state } = useLocation();
    const [searchParams] = useSearchParams();
    const query = Object.fromEntries(searchParams) as KeyValueType<string>;
    const isOrigin = useMemo(
      () => state?.showOrigin === "on",
      [state?.showOrigin]
    );
    const HeadingElm = useCallback(
      ({ label }: { label?: string }) =>
        label && linkLabel ? (
          <Link
            to={MakeRelativeURL({
              pathname:
                typeof linkLabel === "string" ? linkLabel : "/gallery/" + name,
              query,
            })}
          >
            {label}
          </Link>
        ) : (
          <>{label}</>
        ),
      [linkLabel, name, query]
    );
    const [curMax, setCurMax] = useState(max);
    const showMoreButton = curMax < (list.length || 0);
    const visibleMax = showMoreButton ? curMax - 1 : curMax;

    return (
      <div {...args} ref={ref}>
        {h2 || h4 ? (
          <div className="galleryLabel outLabel">
            {h2 ? <h2>{h2}</h2> : null}
            {h4 ? <h4>{h4}</h4> : null}
          </div>
        ) : null}
        <div className="galleryContainer">
          {showGalleryLabel ? (
            <div className="galleryLabel">
              <h2>
                <HeadingElm label={label} />
              </h2>
              {showCount ? <div className="count">({list.length})</div> : null}
            </div>
          ) : null}
          {isComplete ? (
            <div className="list">
              {list
                .filter((_, i) => i < visibleMax)
                .map((image, i) => (
                  <LinkMee
                    key={i}
                    className="item"
                    {...(image.direct
                      ? { to: image.direct }
                      : {
                          to: ({ search }) => {
                            const query = Object.fromEntries(
                              new URLSearchParams(search)
                            ) as KeyValueType<string>;
                            if (image.originName)
                              query.image = image.originName;
                            if (image.album?.name)
                              query.album = image.album.name;
                            if (image.album?.name !== name) query.group = name;
                            return { query };
                          },
                          state: ({ state, pathname }) => {
                            if (!state) state = {};
                            state.from = pathname;
                            return state;
                          },
                          preventScrollReset: true,
                        })}
                  >
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
                  </LinkMee>
                ))}
              {showMoreButton ? (
                <div className="item">
                  <MoreButton
                    className="gallery-button-more"
                    onClick={() => {
                      setCurMax((c) => c + step);
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="loadingNow text-main-soft my-4">
              よみこみちゅう…
            </div>
          )}
        </div>
      </div>
    );
  }
);
