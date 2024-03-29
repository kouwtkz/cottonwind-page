import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useImageState } from "../state/ImageState";
import { serverSite } from "../data/server/site";
import { useDataState } from "../state/StateSet";
import {
  GalleryItemObjectType,
  GalleryItemType,
  GalleryItemsType,
  GalleryListPropsBase,
} from "../types/GalleryType";
import {
  ReactNode,
  createRef,
  forwardRef,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaImageAlbumType,
  MediaImageItemType,
} from "../types/MediaImageDataType";
import { KeyValueStringType } from "../types/ValueType";
import {
  filterMonthList,
  filterMonthType,
} from "../components/tag/GalleryTags";
import {
  filterImagesTags,
  filterPickFixed,
} from "../data/functions/FilterImages";
import { create } from "zustand";
import { InPageMenu } from "../components/layout/InPageMenu";
import {
  GalleryYearFilter,
  GallerySearchArea,
  GalleryTagsSelect,
  getJSTYear,
} from "../components/tag/GalleryFormSet";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axios from "axios";
import ArrowUpButton from "../components/svg/button/arrow/ArrowUpButton";
import { MakeRelativeURL } from "../components/doc/MakeURL";
import { RiBook2Fill, RiFilePdf2Fill } from "react-icons/ri";
import { ImageMeeThumbnail } from "../components/layout/ImageMee";
import MoreButton from "../components/svg/button/MoreButton";
import { useParamsState } from "../state/ParamsState";

export function GalleryPage({ children }: { children?: ReactNode }) {
  return (
    <div className="galleryPage">
      <GalleryPageMain />
      {children}
    </div>
  );
}

function GalleryPageMain() {
  const galleryDefault = serverSite.gallery?.default;
  const { isComplete } = useDataState();
  if (!isComplete) return <></>;
  return <GalleryObjectConvert items={galleryDefault} />;
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
            <ArrowUpButton />
          </button>
        </div>
      ) : (
        <></>
      ),
    [group]
  );
  const items = useMemo(
    () =>
      serverSite.gallery?.generate?.find(
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
        filterButton={true}
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
  const albums = convertItemArrayType(items).map((item) =>
    convertItemObjectType(item)
  );
  albums.forEach((item) => {
    if (!item.list) {
      const name = item.name;
      switch (name) {
        case "pickup":
        case "topImage":
          item.list = filterPickFixed({ images: imageItemList, name });
          item.label = item.label ?? item.name;
          item.max = item.max ?? 20;
          item.linkLabel = item.linkLabel ?? false;
          item.filterButton = item.filterButton ?? true;
          item.hideWhenFilter = true;
          break;
        default:
          const album = imageAlbumList.find((album) => album.name === name);
          if (album) {
            item.list = album.list;
            item.label = item.label ?? album.name;
            item.max = item.max ?? args.max ?? 20;
            item.step = item.step ?? args.step;
            item.linkLabel = item.linkLabel ?? args.linkLabel ?? true;
            item.filterButton = item.filterButton ?? args.filterButton ?? true;
          }
          break;
      }
    }
  });

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

export function GalleryObject({ items }: { items: GalleryItemObjectType[] }) {
  const { setItems, setYFList } = useGalleryObject(
    useCallback(({ setItems, setYFList }) => ({ setItems, setYFList }), [items])
  );

  const { query } = useParamsState(({ query }) => ({ query }));
  const {
    sort: sortParam,
    filter: filterParam,
    type: typeParam,
    month: monthParam,
    q: qParam,
    tag: tagParam,
  } = query;
  const year = Number(query.year);
  const monthlyEventMode = useMemo(
    () => filterParam === "monthlyOnly",
    [filterParam]
  );
  const filterMonthly = useMemo(
    () => filterMonthList.find(({ month }) => String(month) === monthParam),
    [monthParam]
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
        item.hideWhenFilter && (typeParam || tags || searches || monthParam)
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
        if (filterParam === "topImage" || filterParam === "pickup") {
          images = images.filter((image) => image[filterParam]);
        }
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
    filterParam,
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
  return <GalleryBody items={items} yfList={yfList} />;
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
        if (!import.meta.env.DEV) {
          setTimeout(() => {
            setImageFromUrl();
          }, 10 * targetFiles.length);
        }
      }
    });
  }, []);
  const onDrop = useCallback(
    (acceptedFiles: File[]) => upload(acceptedFiles),
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

function GalleryBody({
  items,
  yfList,
}: {
  items: GalleryItemObjectType[];
  yfList: MediaImageItemType[][];
}) {
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
      <InPageMenu list={inPageList} adjust={64} />
      <div>
        <div className="galleryHeader">
          <GalleryYearFilter />
          <GallerySearchArea />
          <GalleryTagsSelect />
        </div>
        {items
          .map((item, i) => ({ ...item, i }))
          .filter(({ i }) => yfList[i].length)
          .map(({ i, ...item }) => (
            <div key={i}>
              {import.meta.env.DEV ? (
                <UploadChain item={item}>
                  <GalleryContent
                    ref={refList[i]}
                    list={yfList[i]}
                    item={item}
                  />
                </UploadChain>
              ) : (
                <GalleryContent ref={refList[i]} list={yfList[i]} item={item} />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

interface GalleryContentProps extends React.HTMLAttributes<HTMLDivElement> {
  item: GalleryItemObjectType;
  list: MediaImageItemType[];
}

const GalleryContent = forwardRef<HTMLDivElement, GalleryContentProps>(
  function GalleryContent({ item, list, ...args }, ref) {
    const { isComplete } = useDataState();
    const {
      name,
      linkLabel,
      h2,
      h4,
      label,
      filterButton = true,
      max = 20,
      step = 20,
    } = item;
    const { query } = useParamsState();
    const HeadingElm = useCallback(
      ({ label }: { label?: string }) =>
        label && linkLabel ? (
          <Link
            to={typeof linkLabel === "string" ? linkLabel : "/gallery/" + name}
          >
            {label}
          </Link>
        ) : (
          <>{label}</>
        ),
      [linkLabel, name]
    );
    const [curMax, setCurMax] = useState(max);
    const showMoreButton = curMax < (list.length || 0);
    const visibleMax = showMoreButton ? curMax - 1 : curMax;

    if (!list.length) return <></>;
    return (
      <div {...args} ref={ref}>
        {h2 || h4 ? (
          <div className="galleryLabel outLabel">
            {h2 ? <h2>{h2}</h2> : null}
            {h4 ? <h4>{h4}</h4> : null}
          </div>
        ) : null}
        <div className="galleryContainer">
          <div className="galleryLabel">
            <h2>
              <HeadingElm label={label} />
            </h2>
            <div className="count">({list.length})</div>
          </div>
          {isComplete ? (
            <div className={`list${list.length < 3 ? " min2" : ""}`}>
              {list
                .filter((_, i) => i < visibleMax)
                .map((image, i) => (
                  <Link
                    key={i}
                    className="item"
                    {...(image.direct
                      ? { to: image.direct }
                      : {
                          to: MakeRelativeURL({
                            query: {
                              ...query,
                              image: image.originName,
                              ...(image.album?.name
                                ? { album: image.album.name }
                                : {}),
                              ...(image.album?.name !== name
                                ? { group: name }
                                : {}),
                            },
                          }),
                          preventScrollReset: true,
                        })}
                  >
                    <div>
                      {image.embed ? (
                        image.type === "ebook" ? (
                          <div className="translucent-comics-button">
                            <RiBook2Fill />
                          </div>
                        ) : image.type === "pdf" ? (
                          <div className="translucent-comics-button">
                            <RiFilePdf2Fill />
                          </div>
                        ) : null
                      ) : null}
                      <ImageMeeThumbnail
                        imageItem={image}
                        loadingScreen={true}
                      />
                    </div>
                  </Link>
                ))}
              {showMoreButton ? (
                <MoreButton
                  className="gallery-button-more"
                  onClick={() => {
                    setCurMax((c) => c + step);
                  }}
                />
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
