import { ReactNode, useCallback, useLayoutEffect, useMemo } from "react";
import { create } from "zustand";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MultiParser from "../components/doc/MultiParser";
import { BlogDateOptions as opt } from "../components/doc/DateTimeFormatOptions";
import { ImageMee } from "../components/layout/ImageMee";
import CloseButton from "../components/svg/button/CloseButton";
import { EmbedNode, getEmbedURL } from "./Embed";
import ImageEditForm from "./ImageEditForm";
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
import { useGalleryObject } from "../routes/GalleryPage";
import { MediaImageItemType } from "../types/MediaImageDataType";

const body = typeof window === "object" ? document?.body : null;
const bodyLock = (m: boolean) => {
  if (m) {
    body?.classList.add("lockScroll");
  } else {
    body?.classList.remove("lockScroll");
  }
};

type ImageViewerType = {
  image: MediaImageItemType | null;
  setImage: (image: MediaImageItemType | null) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
};
export const useImageViewer = create<ImageViewerType>((set) => ({
  image: null,
  setImage(image) {
    set(() => ({
      image,
      isOpen: true,
    }));
    bodyLock(true);
  },
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
}));

export default function ImageViewer() {
  const { imageItemList } = useImageState();
  const { charaList } = useCharaState();
  const nav = useNavigate();
  const { isOpen, onClose, image, setImage, editMode, setEditMode } =
    useImageViewer();
  const { pathname, search: searchStr } = useLocation();
  const search = new URLSearchParams(searchStr);
  const query = Object.fromEntries(search);
  const imageParam = query.image;
  const albumParam = query.album;
  const groupParam = query.group ?? albumParam;
  const modeParam = query.mode;
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  const tagsOptions = autoFixTagsOptions(getTagsOptions(defaultTags));
  const { isComplete } = useDataState();

  const { items, yfList } = useGalleryObject();
  const galleryItemIndex = useMemo(
    () => items?.findIndex((item) => item.name === groupParam) ?? -1,
    [items, groupParam]
  );
  const groupImageList = useMemo(
    () => yfList[galleryItemIndex] ?? [],
    [yfList, galleryItemIndex]
  );

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

  const imageFinder = useCallback(
    (imageParam: string, albumParam?: string) => {
      const albumItemList = albumParam
        ? imageItemList.filter(({ album }) => album?.name === albumParam)
        : imageItemList;
      return (
        albumItemList.find((image) =>
          image.originName?.startsWith(imageParam)
        ) ?? null
      );
    },
    [imageItemList]
  );

  useLayoutEffect(() => {
    if (!imageParam) {
      if (isOpen) onClose();
    } else {
      if (isComplete) setImage(imageFinder(imageParam, albumParam));
    }
  }, [imageParam, albumParam, isOpen, isComplete]);
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

  const imageIndex = useMemo(
    () => groupImageList.findIndex(({ URL }) => image?.URL === URL),
    [image?.URL, groupImageList]
  );

  const beforeAfterImage = useMemo(
    () => ({
      before: groupImageList[imageIndex - 1],
      after: groupImageList[imageIndex + 1],
    }),
    [groupImageList, imageIndex]
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

  const PreviewArea = useCallback(
    () => (
      <div className="preview">
        {image ? (
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
                        pathname: "/gallery/ebook",
                        query: { name: image.embed },
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
        ) : null}
      </div>
    ),
    [image, isProd]
  );

  const InfoCmp = useCallback(
    ({ children }: { children?: ReactNode }) => (
      <div className="infoArea">
        {!("pic" in query) && image?.album?.visible?.info ? (
          <>
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
                    {children}
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
          </>
        ) : null}
      </div>
    ),
    [
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
    ]
  );

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
              <PreviewArea />
              <InfoCmp />
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
