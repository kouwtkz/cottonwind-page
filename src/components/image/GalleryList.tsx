import {
  MediaImageAlbumType,
  MediaImageItemType,
} from "../../types/MediaImageDataType";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ImageMeeThumbnail } from "./ImageMee";
import MoreButton from "../svg/button/MoreButton";
import { useDropzone } from "react-dropzone";
import { useImageState } from "../../state/ImageState";
import { upload } from "./uploadFunction";
import { MakeRelativeURL } from "../doc/MakeURL";
import { filterImagesTags } from "./FilterImages";
import { filterMonthList } from "../tag/GalleryTags";
import { useImageViewer } from "../../state/ImageViewer";
import { RiBook2Fill, RiFilePdf2Fill } from "react-icons/ri";

export interface GalleryListPropsBase {
  size?: number;
  h2?: string;
  h4?: string;
  label?: string;
  showLabel?: boolean;
  linkLabel?: boolean | string;
  max?: number;
  step?: number;
  autoDisable?: boolean;
  filterButton?: boolean;
  tags?: string | string[];
}

interface GalleryListProps extends GalleryListPropsBase {
  album: MediaImageAlbumType | null;
  loading?: boolean;
  hideWhenFilter?: boolean;
}

function getYear(date?: Date | null) {
  return date?.toLocaleString("ja", { timeZone: "JST" }).split("/", 1)[0];
}
function getYearObjects(dates: (Date | null | undefined)[]) {
  return dates
    .map((date) => getYear(date))
    .reduce((a, c) => {
      const g = a.find(({ year }) => c === year);
      if (g) g.count++;
      else if (c) a.push({ year: c, count: 1 });
      return a;
    }, [] as { year: string; count: number }[]);
}

export default function GalleryList(args: GalleryListProps) {
  return (
    <Suspense>
      <Main {...args} />
    </Suspense>
  );
}

function Main({
  album,
  label,
  size = 320,
  showLabel = true,
  linkLabel = false,
  max = 1000,
  step = 20,
  autoDisable = false,
  filterButton = false,
  loading = false,
  hideWhenFilter = false,
  tags = [],
  h2: _h2,
  h4: _h4,
}: GalleryListProps) {
  const { imageItemList, setImageFromUrl } = useImageState();
  const isDev = import.meta.env.DEV;
  const { albumImages, setAlbumImages } = useImageViewer();
  const refImages = useRef<MediaImageItemType[]>([]);
  const nav = useNavigate();
  const search = new URLSearchParams(useLocation().search);
  const yearSelectRef = useRef<HTMLSelectElement>(null);
  const [curMax, setCurMax] = useState(max);

  useEffect(() => {
    const groupName = search.get("group") ?? search.get("album");
    if (album?.name === groupName && albumImages.length === 0) {
      const list = refImages.current
        .filter((image) => image.URL)
        .map((image) => image.URL as string);
      if (list.length > 0) setAlbumImages(list);
    }
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (album)
        upload({
          isServerMode: isDev,
          imageItemList,
          album: album,
          files: acceptedFiles,
          setImageFromUrl,
          tags,
        });
    },
    [album, isDev, imageItemList, setImageFromUrl, tags]
  );
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    noClick: true,
  });

  if (!album || (autoDisable && album.list.length === 0)) return null;
  let albumList = album.list.sort(
    (a, b) => (b.time?.getTime() || 0) - (a.time?.getTime() || 0)
  );
  let afterFilter = false;
  let monthlyEventMode = true;
  const searchFilter = search.get("filter");
  if (searchFilter) {
    if (hideWhenFilter) return <></>;
    else {
      afterFilter = true;
      switch (searchFilter) {
        case "topImage":
        case "pickup":
          albumList = albumList.filter((item) => item[searchFilter]);
          break;
        case "monthlyOnly":
          monthlyEventMode = false;
          break;
        default:
          albumList = [];
          break;
      }
    }
  }
  const itemType = search.get("type");
  if (itemType) {
    if (hideWhenFilter) return <></>;
    afterFilter = true;
    albumList = albumList.filter(({ type }) => type === itemType);
  }
  const month = search.get("month");
  if (month) {
    if (hideWhenFilter) return <></>;
    afterFilter = true;
    const filterMonthly = filterMonthList.find(
      (v) => String(v.month) === month
    );
    if (filterMonthly) {
      if (monthlyEventMode) {
        albumList = filterImagesTags({
          images: albumList,
          tags: filterMonthly.tags,
          every: false,
        });
      } else {
        albumList = filterImagesTags({
          images: albumList,
          tags: filterMonthly.tags.filter((v, i) => i === 0),
        });
      }
    }
  }
  const searchTag = search.get("tag");
  if (searchTag) {
    if (hideWhenFilter) return <></>;
    afterFilter = true;
    albumList = filterImagesTags({
      images: albumList,
      tags: searchTag.split(","),
    });
  }
  const searches = search
    .get("q")
    ?.split(" ", 3)
    .map((q) => {
      const qs = q.split(":");
      if (qs.length === 1 && qs[0].startsWith("#"))
        return {
          key: "hashtag",
          value: qs[0].slice(1),
          reg: new RegExp(`${qs[0]}(\\s|$)`, "i"),
        };
      else {
        const key = qs.length > 1 ? qs[0] : "keyword";
        const value = qs.length > 1 ? qs[1] : qs[0];
        const option = qs.length > 2 ? qs[2] : undefined;
        return { key, value, option };
      }
    });
  if (searches) {
    if (hideWhenFilter) return <></>;
    else {
      afterFilter = true;
      albumList = albumList.filter((image) => {
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
              const imageValue = image[key];
              if (imageValue) return imageValue.match(value);
              else return false;
            default:
              return ImageDataStr.match(value);
          }
        });
      });
    }
  }
  const year = search.get("year");
  const yearList = getYearObjects(albumList.map((item) => item.time));
  if (year) {
    afterFilter = true;
    albumList = albumList.filter((item) => getYear(item.time) === year);
  }
  if (!loading && afterFilter && albumList.length === 0) return <></>;

  const sortList: { key: string; order: "asc" | "desc" }[] = [];
  const searchSort = search.get("sort") || "";
  switch (searchSort) {
    case "recently":
      sortList.push({ key: "time", order: "desc" });
      break;
    case "leastRecently":
      sortList.push({ key: "time", order: "asc" });
      break;
    case "nameOrder":
      sortList.push({ key: "name", order: "asc" });
      break;
    case "leastNameOrder":
      sortList.push({ key: "name", order: "desc" });
      break;
  }
  if (sortList.every(({ key }) => key !== "time"))
    sortList.unshift({ key: "time", order: "desc" });
  if (sortList.every(({ key }) => key !== "name"))
    sortList.unshift({ key: "name", order: "asc" });
  sortList.forEach(({ key, order }) => {
    switch (key) {
      case "time":
        albumList.sort((a, b) => {
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
        albumList.sort((a, b) => {
          if (a[key] === b[key]) return 0;
          const result = a[key] > b[key];
          return (order === "asc" ? result : !result) ? 1 : -1;
        });
    }
  });

  refImages.current = albumList;

  const showMoreButton = curMax < (albumList.length || 0);
  const visibleMax = showMoreButton ? curMax - 1 : curMax;
  const heading = label || album.name;
  const headingElm = linkLabel ? (
    <Link
      to={
        typeof linkLabel === "string"
          ? linkLabel
          : `/gallery/${album.group || album.name}`
      }
    >
      {heading}
    </Link>
  ) : (
    <>{heading}</>
  );
  return (
    <>
      {_h2 || _h4 ? (
        <div className="galleryLabel outLabel">
          {_h2 ? <h2>{_h2}</h2> : null}
          {_h4 ? <h4>{_h4}</h4> : null}
        </div>
      ) : null}
      <div className="galleryContainer" {...getRootProps()}>
        <input name="upload" {...getInputProps()} />
        <div className="galleryLabel">
          {filterButton ? (
            <div>
              <select
                title="フィルタリング"
                ref={yearSelectRef}
                value={year || ""}
                onChange={() => {
                  if (yearSelectRef.current) {
                    const yearSelect = yearSelectRef.current;
                    const query = Object.fromEntries(search);
                    if (yearSelect.value) query.year = yearSelect.value;
                    else delete query.year;
                    nav(MakeRelativeURL({ query }), {
                      preventScrollReset: false,
                    });
                  }
                }}
              >
                <option value="">
                  all ({yearList.reduce((a, c) => a + c.count, 0)})
                </option>
                {yearList.map(({ year, count }, i) => (
                  <option key={i} value={year}>
                    {year} ({count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {showLabel ? <h2>{headingElm}</h2> : null}
        </div>
        <div className={`list${albumList.length < 3 ? " min2" : ""}`}>
          {loading ? (
            <div className="loadingNow text-main-soft my-4">
              よみこみちゅう…
            </div>
          ) : (
            <>
              {albumList
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
                              ...Object.fromEntries(search),
                              image: image.originName,
                              ...(image.album?.name
                                ? { album: image.album.name }
                                : {}),
                              ...(image.album?.name !== album.name
                                ? { group: album.name }
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
