import React, {
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
import { MultiParserWithMedia } from "@/components/parse/MultiParserWithMedia";
import { BlogDateOptions as opt } from "@/functions/doc/DateTimeFormatOptions";
import { ImageMee } from "@/layout/ImageMee";
import CloseButton from "../components/svg/button/CloseButton";
import { EmbedNode, getEmbedURL } from "./Embed";
import ImageEditForm, {
  imageEditIsDirty,
  imageEditIsEdit,
  imageEditIsEditHold,
} from "../routes/edit/ImageEditForm";
import {
  defaultGalleryTags,
  getTagsOptions,
  autoFixGalleryTagsOptions,
} from "@/components/dropdown/SortFilterTags";
import {
  RiBook2Fill,
  RiFilePdf2Fill,
  RiFullscreenFill,
  RiLinkM,
  RiStore3Fill,
} from "react-icons/ri";
import { charactersMapAtom, CharaState } from "./CharaState";
import { imagesAtom, UrlMediaOrigin } from "./ImageState";
import { dataIsCompleteAtom } from "./DataState";
import { useGalleryObject } from "../routes/GalleryPage";
import { imageFindFromName } from "../data/functions/images";
import { useHotkeys } from "react-hotkeys-hook";
import { useAtom } from "jotai";
import { scrollLock } from "@/components/hook/ScrollLock";
import { isLoginAtom, MediaOriginAtom } from "./EnvState";
import { getName } from "@/functions/doc/PathParse";

type ImageViewerType = {
  image: OldMediaImageItemType | null;
  setImage: (image: OldMediaImageItemType | null) => void;
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

interface InfoAreaProps {
  image: ImageType;
}
function InfoArea({ image }: InfoAreaProps) {
  const [isComplete] = useAtom(dataIsCompleteAtom);
  const { onClose } = useImageViewer();
  const searchParams = useSearchParams()[0];
  const stateIsEdit = useAtom(imageEditIsEdit)[0];
  const [stateIsEditHold] = useAtom(imageEditIsEditHold);
  const charactersMap = useAtom(charactersMapAtom)[0];
  const isLogin = useAtom(isLoginAtom);
  const isDev = Boolean(import.meta.env?.DEV);
  const isEdit = useMemo(
    () => stateIsEdit || stateIsEditHold,
    [stateIsEdit, stateIsEditHold]
  );
  const titleEqFilename = useMemo(
    () =>
      isDev ? false : image?.name ? image.src?.startsWith(image.name) : true,
    [image]
  );
  const tagsOptions = autoFixGalleryTagsOptions(
    getTagsOptions(defaultGalleryTags)
  );
  if (searchParams.has("pic") || !image?.albumObject) return <></>;
  const tags = image.tags ?? [];
  const charaTags = useMemo(
    () => tags.map((tag) => charactersMap?.get(tag)!).filter((v) => v),
    [tags, charactersMap]
  );
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
              {image.albumObject?.visible?.title &&
              (image.albumObject.visible.filename || !titleEqFilename) ? (
                <h2 className="title">{image.name}</h2>
              ) : (
                <div className="title" />
              )}
              <div className="description">
                <MultiParserWithMedia>{image.description}</MultiParserWithMedia>
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
                  const item = tagsOptions.find(({ value }) => value === tag);
                  if (!item) return item;
                  const search = createSearchParams(
                    item.query ?? { tag: item.value ?? "" }
                  );
                  return (
                    <Link
                      to={new URL("?" + search.toString(), tagsBaseURL).href}
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
          {isLogin ? (
            <ImageEditForm image={image} />
          ) : (
            <GalleryViewerPaging image={image} />
          )}
        </>
      ) : null}
    </div>
  );
}

interface PreviewAreaProps {
  image: ImageType;
}
function PreviewArea({ image }: PreviewAreaProps) {
  const mediaOrigin = useAtom(MediaOriginAtom)[0];
  const MediaOrigin = useCallback(
    (src?: string) => UrlMediaOrigin(mediaOrigin, src),
    [mediaOrigin]
  );
  const l = useLocation();
  const state = l.state;
  const isOrigin = useMemo(
    () => state?.showOrigin === "on",
    [state?.showOrigin]
  );

  return (
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
                href={MediaOrigin(image.webp || image.src)}
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
  );
}

export function ImageViewer() {
  const imageItemList = useAtom(imagesAtom)[0];
  const { isOpen, onOpen, onClose } = useImageViewer();
  const [isDirty, setIsDirty] = useAtom(imageEditIsDirty);
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const l = useLocation();
  const state = l.state;
  const imageParam = searchParams.get("image");
  const setIsEdit = useAtom(imageEditIsEdit)[1];

  function backAction() {
    if (
      !isDirty ||
      confirm("フォームが保存されていません。\n本当に戻りますか？")
    ) {
      setIsEdit(false);
      setIsDirty(false);
      if (state?.from) nav(-1);
      else {
        searchParams.delete("image");
        searchParams.delete("pic");
        searchParams.delete("group");
        searchParams.delete("album");
        setSearchParams(searchParams, { preventScrollReset: true, state });
      }
    }
  }

  useHotkeys("escape", (e) => {
    if (isOpen) {
      backAction();
      e.preventDefault();
    }
  });

  const image = useMemo(() => {
    if (imageParam) {
      const searchParam = "/" + imageParam + ".";
      return imageItemList.find((v) => v.src?.includes(searchParam));
    } else return;
  }, [imageItemList, imageParam]);

  useEffect(() => {
    if (isOpen && !image) {
      onClose();
    } else if (image) {
      if (!isOpen) onOpen();
    }
  }, [isOpen, image]);

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
              className="modalClose"
              width={60}
              height={60}
              onClick={(e) => {
                backAction();
                e.stopPropagation();
              }}
            />
            <div className="window modal">
              <PreviewArea image={image} />
              <InfoArea image={image} />
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
  image: ImageType | null;
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
  const imageIndex = useMemo(() => {
    const src = image?.src;
    if (src) {
      return groupImageList.findIndex((groupImage) => groupImage.src === src);
    } else return -1;
  }, [image?.src, groupImageList]);

  const prevNextImage = useMemo(
    () => ({
      before: groupImageList[imageIndex - 1],
      after: groupImageList[imageIndex + 1],
    }),
    [groupImageList, imageIndex]
  );

  const prevNextToHandler = useCallback(
    (image: ImageType) => {
      if (image.src) searchParams.set("image", getName(image.src));
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
