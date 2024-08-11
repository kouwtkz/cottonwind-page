import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { create } from "zustand";
import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { MultiParserWithMedia } from "@/functions/doc/MultiParserWithMedia";
import { BlogDateOptions as opt } from "@/functions/doc/DateTimeFormatOptions";
import { ImageMee } from "@/layout/ImageMee";
import CloseButton from "../components/svg/button/CloseButton";
import { EmbedNode, getEmbedURL } from "./Embed";
import ImageEditForm from "../components/form/edit/ImageEditForm";
import {
  defaultTags,
  getTagsOptions,
  autoFixTagsOptions,
} from "@/data/GalleryTags";
import {
  RiBook2Fill,
  RiFilePdf2Fill,
  RiFullscreenFill,
  RiLinkM,
  RiStore3Fill,
} from "react-icons/ri";
import { CharaState, useCharaState } from "@/state/CharaState";
import { useImageState } from "@/state/ImageState";
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
  const { imageItemList } = useImageState().imageObject;
  const { charaObject } = useCharaState();
  const { isOpen, onOpen, onClose } = useImageViewer();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const l = useLocation();
  const pathname = l.pathname;
  const state = l.state;
  const imageParam = searchParams.get("image");
  const albumParam = searchParams.get("album") ?? undefined;
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  const tagsOptions = autoFixTagsOptions(getTagsOptions(defaultTags));
  const { isComplete } = useDataState();

  const backAction = useCallback(() => {
    if (state?.from) nav(-1);
    else {
      searchParams.delete("image");
      searchParams.delete("pic");
      searchParams.delete("group");
      searchParams.delete("album");
      setSearchParams(searchParams, { preventScrollReset: true, state });
    }
  }, [searchParams, state]);

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
                      to={
                        new URL(
                          "/gallery/ebook?name=" + image.embed,
                          location.href
                        ).href
                      }
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
    ({ children }: { children?: ReactNode }) => {
      if (searchParams.has("pic") || !image?.album?.visible?.info) return <></>;
      const tags = image.tags ?? [];
      const charaTags = tags
        .map((tag) => charaObject[tag] as CharaType)
        .filter((v) => v);
      const registeredTags = tags.filter((tag) =>
        tagsOptions.some(({ value }) => value === tag)
      );
      const othertags = tags.filter(
        (tag) =>
          charaTags.every((ct) => ct.id !== tag) &&
          registeredTags.every((rt) => rt !== tag)
      );
      const tagsBaseURL = location.origin + "/gallery";
      return (
        <div className="infoArea">
          <CharaState />
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
                    <MultiParserWithMedia>
                      {image.description}
                    </MultiParserWithMedia>
                  </div>
                  <div className="tagList">
                    {charaTags.map((chara, i) => {
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
                    {registeredTags.map((tag, i) => {
                      const item = tagsOptions.find(
                        ({ value }) => value === tag
                      );
                      if (!item) return item;
                      const search = createSearchParams(
                        item.query ?? { tag: item.value ?? "" }
                      );
                      return (
                        <Link
                          to={
                            new URL("?" + search.toString(), tagsBaseURL).href
                          }
                          className="other"
                          preventScrollReset={false}
                          key={i}
                        >
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    {othertags.map((tag, i) => (
                      <Link
                        className="unregistered"
                        to={new URL("?q=%23" + tag, tagsBaseURL).href}
                        key={i}
                      >
                        #{tag}
                      </Link>
                    ))}
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
                  {image.copyright ? (
                    <div className="grayRight">
                      <div className="copyright">
                        <span>版権元:</span>
                        {image.copyright.map((value, i) => (
                          <Link
                            to={
                              new URL(
                                "?" +
                                  createSearchParams({
                                    q: `"${value}"`,
                                  }),
                                tagsBaseURL
                              ).href
                            }
                            key={i}
                          >
                            {value}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
      );
    },
    [
      charaObject,
      image,
      isDev,
      onClose,
      pathname,
      tagsOptions,
      titleEqFilename,
      searchParams,
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
  const [searchParams] = useSearchParams();
  const state = useLocation().state;
  const albumParam = searchParams.get("album");
  const groupParam = searchParams.get("group") ?? albumParam;
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
  const prevNextToHandler = useCallback(
    (image: MediaImageItemType) => {
      if (image.originName) searchParams.set("image", image.originName);
      return new URL("?" + searchParams.toString(), location.href).href;
    },
    [searchParams]
  );
  return (
    <div className={"paging" + (className ? ` ${className}` : "")} {...args}>
      {prevNextImage?.before ? (
        <Link
          className="prev"
          to={prevNextToHandler(prevNextImage.before)}
          state={state}
          preventScrollReset={true}
          replace={true}
        >
          <div className="cursor">≪</div>
          <div>{prevNextImage.before.name}</div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {prevNextImage?.after ? (
        <Link
          className="next"
          to={prevNextToHandler(prevNextImage.after)}
          state={state}
          preventScrollReset={true}
          replace={true}
        >
          <div>{prevNextImage.after.name}</div>
          <div className="cursor">≫</div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
