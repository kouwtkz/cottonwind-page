import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { create } from "zustand";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MultiParser from "../components/doc/MultiParser";
import { BlogDateOptions as opt } from "../components/doc/DateTimeFormatOptions";
import { ImageMee } from "../components/layout/ImageMee";
import CloseButton from "../components/svg/button/CloseButton";
import { EmbedNode, getEmbedURL } from "./Embed";
import ImageEditForm from "../components/form/edit/ImageEditForm";
import {
  defaultTags,
  getTagsOptions,
  autoFixTagsOptions,
} from "../components/tag/GalleryTags";
import {
  LinkMee,
  LocationStateType,
  MakeRelativeURL,
  SearchSet,
} from "../components/doc/MakeURL";
import {
  RiBook2Fill,
  RiFilePdf2Fill,
  RiFullscreenFill,
  RiLinkM,
  RiStore3Fill,
} from "react-icons/ri";
import { useCharaState } from "../state/CharaState";
import { useImageState } from "./ImageState";
import { useDataState } from "./StateSet";
import { useGalleryObject } from "../routes/GalleryPage";
import { imageFindFromName } from "../data/functions/images";

const html = typeof window === "object" ? document.querySelector("html") : null;
const scrollLock = (m: boolean) => {
  if (m) {
    html?.classList.add("scrollLock");
  } else {
    html?.classList.remove("scrollLock");
  }
};

type ImageViewerType = {
  image: MediaImageItemType | null;
  setImage: (image: MediaImageItemType | null) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};
export const useImageViewer = create<ImageViewerType>((set) => ({
  image: null,
  setImage(image) {
    set(() => ({
      image,
      isOpen: true,
    }));
    scrollLock(true);
  },
  isOpen: false,
  onOpen: () => {
    set(() => ({ isOpen: true }));
    scrollLock(true);
  },
  onClose: () => {
    set(() => ({ isOpen: false, editMode: false, imageSrc: "" }));
    scrollLock(false);
  },
}));

export function ImageViewer() {
  const { imageItemList } = useImageState();
  const { charaObject } = useCharaState();
  const nav = useNavigate();
  const { isOpen, onOpen, onClose } = useImageViewer();
  const search = useLocation().search;
  const { query } = useMemo(() => SearchSet(search), [search]);
  const l = useLocation();
  const pathname = l.pathname;
  const state = l.state as LocationStateType;
  const imageParam = query.image;
  const albumParam = query.album;
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  const tagsOptions = autoFixTagsOptions(getTagsOptions(defaultTags));
  const { isComplete } = useDataState();

  const backAction = useCallback(() => {
    if (state?.from) nav(-1);
    else {
      delete query.image;
      delete query.pic;
      delete query.group;
      delete query.album;
      nav(MakeRelativeURL({ query }), { preventScrollReset: true });
    }
  }, [query, nav, state]);

  const imageFinder = useCallback(
    (imageParam: string, albumParam?: string) =>
      imageFindFromName({ imageParam, albumParam, imageItemList }),
    [imageItemList]
  );

  const image = useMemo(() => {
    if (isComplete && imageParam) {
      const foundImage = imageFinder(imageParam, albumParam);
      return foundImage;
    } else return null;
  }, [imageParam, albumParam, isComplete, state?.image]);

  useEffect(() => {
    if (isOpen && !image) {
      onClose();
    } else if (image) {
      if (!isOpen) onOpen();
    }
  }, [isOpen, image]);

  const titleEqFilename = useMemo(
    () =>
      process.env.NODE_ENV === "development"
        ? false
        : image?.name
        ? image.src.startsWith(image.name)
        : true,
    [image]
  );

  const isEdit = useMemo(() => state?.edit === "on", [state?.edit]);
  const isOrigin = useMemo(
    () => state?.showOrigin === "on",
    [state?.showOrigin]
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
                  className="translucent-button hover-visible fullscreen"
                >
                  <RiFullscreenFill />
                </a>
                {image.link ? (
                  image.type === "ebook" || image.type === "goods" ? (
                    <a
                      title="販売ページを見る"
                      href={image.link}
                      target="_blank"
                      className="translucent-button hover-visible open"
                    >
                      <RiStore3Fill />
                    </a>
                  ) : (
                    <a
                      title="リンクを開く"
                      href={image.link}
                      target="_blank"
                      className="translucent-button hover-visible open"
                    >
                      <RiLinkM />
                    </a>
                  )
                ) : image.embed ? (
                  image.type === "ebook" ? (
                    <Link
                      title="よむ"
                      to={MakeRelativeURL({
                        pathname: "/gallery/ebook",
                        query: { name: image.embed },
                      })}
                      className="translucent-button open"
                    >
                      <RiBook2Fill />
                    </Link>
                  ) : image.type === "pdf" ? (
                    <a
                      title="ひらく"
                      href={getEmbedURL(image.embed)}
                      target="_blank"
                      className="open"
                    >
                      <RiFilePdf2Fill />
                    </a>
                  ) : null
                ) : null}
                <div className="wh-all-fill imageArea">
                  <ImageMee
                    imageItem={image}
                    title={image.name || image.src}
                    originWhenDev={isOrigin}
                  />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    ),
    [image, isProd, isOrigin]
  );

  const InfoCmp = useCallback(
    ({ children }: { children?: ReactNode }) => (
      <>
        {!("pic" in query) && image?.album?.visible?.info ? (
          <div className="infoArea">
            {isComplete ? (
              <>
                {isEdit ? null : (
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
                      {image.tags
                        ?.map((tag) => charaObject[tag])
                        .filter((v) => v)
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
                      {image.embed && image.type === "ebook" ? (
                        <div>本のマークから読むことができる作品です！</div>
                      ) : null}
                    </div>
                    {children}
                  </div>
                )}
                {isDev ? (
                  <ImageEditForm image={image} />
                ) : (
                  <GalleryViewerPaging image={image} />
                )}
              </>
            ) : null}
          </div>
        ) : null}
      </>
    ),
    [
      charaObject,
      image,
      isDev,
      onClose,
      pathname,
      tagsOptions,
      titleEqFilename,
      query,
      isComplete,
      state,
    ]
  );

  return (
    <div id="image_viewer">
      {isOpen && image ? (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) backAction();
          }}
          className="viewer scrollThrough"
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

interface GalleryViewerPagingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  image: MediaImageItemType | null;
}

export function GalleryViewerPaging({
  image,
  className,
  ...args
}: GalleryViewerPagingProps) {
  const { search, state } = useLocation();
  const { query } = useMemo(() => SearchSet(search), [search]);
  const albumParam = query.album;
  const groupParam = query.group ?? albumParam;
  const { items, yfList } = useGalleryObject(({ items, yfList }) => ({
    items,
    yfList,
  }));
  const galleryItemIndex = useMemo(
    () => items?.findIndex((item) => item.name === groupParam) ?? -1,
    [items, groupParam]
  );

  const groupImageList = useMemo(
    () => yfList[galleryItemIndex] ?? [],
    [yfList, galleryItemIndex]
  );
  const imageIndex = useMemo(
    () => groupImageList.findIndex(({ URL }) => image?.URL === URL),
    [image?.URL, groupImageList]
  );

  const prevNextImage = useMemo(
    () => ({
      before: groupImageList[imageIndex - 1],
      after: groupImageList[imageIndex + 1],
    }),
    [groupImageList, imageIndex]
  );
  return (
    <div className={"paging" + (className ? ` ${className}` : "")} {...args}>
      {prevNextImage?.before ? (
        <LinkMee
          className="prev"
          to={{
            query: {
              ...query,
              image: prevNextImage.before.originName,
              ...(prevNextImage.before.album?.name
                ? { album: prevNextImage.before.album.name }
                : {}),
            },
          }}
          state={state}
          preventScrollReset={true}
          replace={true}
        >
          <div className="cursor">≪</div>
          <div>{prevNextImage.before.name}</div>
        </LinkMee>
      ) : (
        <div className="flex-1" />
      )}
      {prevNextImage?.after ? (
        <LinkMee
          className="next"
          to={{
            query: {
              ...query,
              image: prevNextImage.after.originName,
              ...(prevNextImage.after.album?.name
                ? { album: prevNextImage.after.album.name }
                : {}),
            },
          }}
          state={state}
          preventScrollReset={true}
          replace={true}
        >
          <div>{prevNextImage.after.name}</div>
          <div className="cursor">≫</div>
        </LinkMee>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
