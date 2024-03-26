import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { create } from "zustand";
import {
  Link,
  NavigateFunction,
  NavigateOptions,
  useLocation,
  useNavigate,
} from "react-router-dom";
import MultiParser from "../components/doc/MultiParser";
import { BlogDateOptions as opt } from "../components/doc/DateTimeFormatOptions";
import ImageMee from "../components/image/ImageMee";
import CloseButton from "../components/svg/button/CloseButton";
import { EmbedNode, getEmbedURL } from "./Embed";
import ImageEditForm from "../components/image/ImageEditForm";
import {
  defaultTags,
  getTagsOptions,
  autoFixTagsOptions,
} from "../components/tag/GalleryTags";
import { MakeRelativeURL } from "../components/doc/MakeURL";
import { RiBook2Fill, RiFilePdf2Fill, RiFullscreenFill } from "react-icons/ri";
import { useCharaState } from "../state/CharaState";
import { useImageState } from "./ImageState";
import { useDataState } from "./StateSet";

const body = typeof window === "object" ? document?.body : null;
const bodyLock = (m: boolean) => {
  if (m) {
    body?.classList.add("lockScroll");
  } else {
    body?.classList.remove("lockScroll");
  }
};

type ImageViewerType = {
  imageSrc: string;
  albumName: string;
  albumImages: string[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  setImageName: (src: string, album?: string | null) => void;
  setAlbumName: (name: string) => void;
  setAlbumImages: (list: string[]) => void;
};
export const useImageViewer = create<ImageViewerType>((set) => ({
  imageSrc: "",
  albumName: "",
  albumImages: [],
  isOpen: false,
  onOpen: () => {
    set(() => ({ isOpen: true }));
    bodyLock(true);
  },
  onClose: () => {
    set(() => ({ isOpen: false, editMode: false, imageSrc: "" }));
    bodyLock(false);
  },
  editMode: false,
  setEditMode(editMode) {
    set(() => ({ editMode }));
  },
  setImageName(src, album) {
    const option: { imageSrc?: string; albumName?: string } = { imageSrc: src };
    if (typeof album !== "undefined") option.albumName = album || "";
    set(() => ({
      ...option,
      albumImages: [],
      isOpen: true,
    }));
    bodyLock(true);
  },
  setAlbumName(name) {
    set(() => ({ albumName: name }));
  },
  setAlbumImages(list) {
    set(() => ({ albumImages: list }));
  },
}));

export default function ImageViewer() {
  const { imageItemList } = useImageState();
  const { charaList } = useCharaState();
  const nav = useNavigate();
  const {
    isOpen,
    onClose,
    imageSrc,
    albumName,
    setImageName,
    editMode,
    setEditMode,
    albumImages,
  } = useImageViewer();
  const { pathname, search: searchStr } = useLocation();
  const search = new URLSearchParams(searchStr);
  const query = Object.fromEntries(search);
  const imageParam = query.image;
  const albumParam = query.album;
  const modeParam = query.mode;
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  const tagsOptions = autoFixTagsOptions(getTagsOptions(defaultTags));
  const { isComplete } = useDataState();

  const backAction = useCallback(() => {
    nav(-1);
    const href = location.href;
    setTimeout(() => {
      if (href === location.href) {
        delete query.image;
        delete query.pic;
        nav(MakeRelativeURL({ query }), { preventScrollReset: false });
      }
    }, 10);
  }, [query, nav]);

  const updateFlag = useRef(false);
  useLayoutEffect(() => {
    if (!imageParam) {
      if (isOpen) onClose();
    } else if (
      imageParam !== imageSrc ||
      (albumParam && albumParam !== albumName)
    ) {
      setImageName(imageParam, albumParam);
      updateFlag.current = true;
    }
  });
  useLayoutEffect(() => {
    switch (modeParam) {
      case "edit":
        setEditMode(true);
        break;
      default:
        setEditMode(false);
        break;
    }
  }, [modeParam]);

  const image = useMemo(() => {
    if (!imageParam) return null;
    const albumItemList = albumParam
      ? imageItemList.filter(({ album }) => album?.name === albumParam)
      : imageItemList;
    return imageSrc
      ? albumItemList.find((image) =>
          image.originName?.startsWith(imageParam)
        ) || {
          URL: imageSrc,
          src: imageSrc,
          name: imageSrc,
        }
      : null;
  }, [imageItemList, albumParam, imageParam, imageSrc]);

  const albumImageItems = useMemo(
    () =>
      albumImages
        .map(
          (imageURL) =>
            imageItemList[
              imageItemList.findIndex(({ URL }) => URL === imageURL)
            ]
        )
        .filter((v) => v),
    [albumImages, imageItemList]
  );
  const imageIndex = albumImageItems.findIndex(({ URL }) => image?.URL === URL);

  const beforeAfterImage = useMemo(
    () => ({
      before: albumImageItems[imageIndex - 1],
      after: albumImageItems[imageIndex + 1],
    }),
    [albumImageItems, imageIndex]
  );

  const titleEqFilename = useMemo(
    () =>
      process.env.NODE_ENV === "development"
        ? false
        : image?.name
        ? image.src.startsWith(image.name)
        : true,
    [image]
  );

  const InfoCmp = useMemo(() => {
    if ("pic" in query || !image?.album?.visible?.info) return <></>;
    return (
      <div className="infoArea">
        {isComplete ? (
          <>
            {editMode ? null : (
              <div className="info window">
                {image.album.visible.title &&
                (image.album.visible.filename || !titleEqFilename) ? (
                  <h2 className="title">{image.name}</h2>
                ) : (
                  <div className="title" />
                )}
                <div className="description">
                  <MultiParser>{image.description}</MultiParser>
                </div>
                <div className="tagList">
                  {charaList
                    .filter((chara) =>
                      image.tags?.some((tag) => chara.id === tag)
                    )
                    .map((chara, i) => {
                      return (
                        <Link
                          to={"/character/" + chara.id}
                          onClick={() => {
                            onClose();
                            return true;
                          }}
                          className="character"
                          key={i}
                        >
                          {chara?.media?.icon ? (
                            <ImageMee
                              imageItem={chara.media.icon}
                              mode="icon"
                              width={40}
                              height={40}
                              className="charaIcon"
                            />
                          ) : (
                            <></>
                          )}
                          <span className="align-middle">{chara.name}</span>
                        </Link>
                      );
                    })}
                  {image.tags
                    ?.filter((tag) =>
                      tagsOptions.some(({ value }) => value === tag)
                    )
                    .map((tag, i) => {
                      const item = tagsOptions.find(
                        ({ value }) => value === tag
                      );
                      if (!item) return item;
                      return (
                        <Link
                          to={MakeRelativeURL({
                            ...(pathname.startsWith("/gallery")
                              ? {}
                              : { pathname: "/gallery" }),
                            query: item.query || { tag: item.value },
                          })}
                          className="other"
                          preventScrollReset={false}
                          key={i}
                        >
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                </div>
                {image.link ? (
                  <div className="link">
                    <Link target="_blank" to={image.link}>
                      {image.link}
                    </Link>
                  </div>
                ) : null}
                <div className="grayRight">
                  {image.time ? (
                    <div className="time">
                      {image.time.toLocaleString("ja", opt)}
                    </div>
                  ) : null}
                  {image.type === "ebook" ? (
                    <div>本のマークから読むことができる作品です！</div>
                  ) : null}
                </div>
              </div>
            )}
            {isDev ? <ImageEditForm /> : null}
          </>
        ) : null}
        <div className="paging">
          {beforeAfterImage?.before ? (
            <Link
              className="prev"
              to={MakeRelativeURL({
                query: {
                  ...Object.fromEntries(search),
                  image: beforeAfterImage.before.originName,
                  ...(beforeAfterImage.before.album?.name
                    ? { album: beforeAfterImage.before.album.name }
                    : {}),
                },
              })}
              preventScrollReset={false}
              replace={true}
            >
              <div className="cursor">≪</div>
              <div>{beforeAfterImage.before.name}</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {beforeAfterImage?.after ? (
            <Link
              className="next"
              to={MakeRelativeURL({
                query: {
                  ...Object.fromEntries(search),
                  image: beforeAfterImage.after.originName,
                  ...(beforeAfterImage.after.album?.name
                    ? { album: beforeAfterImage.after.album.name }
                    : {}),
                },
              })}
              preventScrollReset={false}
              replace={true}
            >
              <div>{beforeAfterImage.after.name}</div>
              <div className="cursor">≫</div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    );
  }, [
    beforeAfterImage,
    charaList,
    editMode,
    image,
    isDev,
    onClose,
    pathname,
    search,
    tagsOptions,
    titleEqFilename,
    query,
    isComplete,
  ]);

  const previewArea = useMemo(() => {
    if (!image) return <></>;
    return (
      <>
        {image.embed && (image.type === "embed" || image.type === "3d") ? (
          <>
            <EmbedNode className="wh-all-fill" embed={image.embed} />
          </>
        ) : (
          <div className="wh-fill">
            <a
              title="別タブで画像を開く"
              href={(isProd ? image.URL : image.origin) || image.src}
              target="_blank"
              className="fullscreen-button"
            >
              <RiFullscreenFill />
            </a>
            {image.embed ? (
              image.type === "ebook" ? (
                <Link
                  title="よむ"
                  to={MakeRelativeURL({
                    pathname: "/gallery",
                    query: { ebook: image.embed },
                  })}
                  className="read-button"
                >
                  <RiBook2Fill />
                </Link>
              ) : image.type === "pdf" ? (
                <a
                  title="ひらく"
                  href={getEmbedURL(image.embed)}
                  target="_blank"
                  className="read-button"
                >
                  <RiFilePdf2Fill />
                </a>
              ) : null
            ) : null}
            <div className="wh-all-fill imageArea">
              <ImageMee imageItem={image} title={image.name || image.src} />
            </div>
          </div>
        )}
      </>
    );
  }, [image, isProd]);

  return (
    <div id="image_viewer">
      {isOpen && image ? (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) backAction();
          }}
          className="viewer"
        >
          <div>
            <CloseButton
              className="close"
              width={60}
              height={60}
              onClick={(e) => {
                backAction();
                e.stopPropagation();
              }}
            />
            <div className="window modal">
              <div className="preview">{previewArea}</div>
              {InfoCmp}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
