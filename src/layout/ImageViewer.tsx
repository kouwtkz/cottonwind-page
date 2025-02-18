import React, { useEffect, useMemo } from "react";
import { create } from "zustand";
import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { MultiParserWithMedia } from "@/components/parse/MultiParserWithMedia";
import { SiteDateOptions as opt } from "@/functions/DateFunction";
import { ImageMee } from "./ImageMee";
import CloseButton from "@/components/svg/button/CloseButton";
import ImageEditForm, {
  useImageEditIsDirty,
  useImageEditIsEdit,
  useImageEditIsEditHold,
} from "@/routes/edit/ImageEditForm";
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
import { useCharactersMap } from "@/state/CharacterState";
import { useImageState } from "@/state/ImageState";
import { useDataIsComplete } from "@/state/StateSet";
import { useHotkeys } from "react-hotkeys-hook";
import { scrollLock } from "@/components/hook/ScrollLock";
import { useIsLogin, useMediaOrigin } from "@/state/EnvState";
import { concatOriginUrl } from "@/functions/originUrl";
import { EmbedNode, useFilesMap } from "@/state/FileState";
import ShareButton from "@/components/button/ShareButton";
import { MdDownload, MdMoveToInbox } from "react-icons/md";
import { LikeButton } from "@/components/button/LikeButton";

type ImageViewerType = {
  image: ImageType | null;
  setImage: (image: ImageType | null) => void;
  images: ImageType[] | null;
  setImages: (images: ImageType[] | null) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};
export const useImageViewer = create<ImageViewerType>((set) => ({
  image: null,
  setImage(image) {
    set({
      image,
      isOpen: true,
    });
    scrollLock(true);
  },
  images: null,
  setImages(images) {
    set({ images });
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
  const [isComplete] = useDataIsComplete();
  const { onClose } = useImageViewer();
  const searchParams = useSearchParams()[0];
  const stateIsEdit = useImageEditIsEdit()[0];
  const [stateIsEditHold] = useImageEditIsEditHold();
  const charactersMap = useCharactersMap()[0];
  const isLogin = useIsLogin()[0];
  const isEdit = useMemo(
    () => stateIsEdit || stateIsEditHold,
    [stateIsEdit, stateIsEditHold]
  );
  const tagsOptions = autoFixGalleryTagsOptions(
    getTagsOptions(defaultGalleryTags)
  );
  if (searchParams.has("pic") || !image?.albumObject) return <></>;
  const tags = image.tags ?? [];
  const charaTags = useMemo(
    () =>
      image.characters?.map((tag) => charactersMap?.get(tag)!).filter((v) => v),
    [image.characters, charactersMap]
  );
  const registeredTags = tags.filter((tag) =>
    tagsOptions.some(({ value }) => value === tag)
  );
  const othertags = tags.filter((tag) =>
    registeredTags.every((rt) => rt !== tag)
  );
  const tagsBaseURL = location.origin + "/gallery";

  return (
    <div className="infoArea">
      {isComplete ? (
        <>
          {isEdit ? null : (
            <div className="info window">
              {(
                image.albumObject.visible
                  ? image.albumObject.visible.title
                  : true
              ) ? (
                <h2 className="title">{image.title || image.key}</h2>
              ) : null}
              <div className="description">
                <MultiParserWithMedia>{image.description}</MultiParserWithMedia>
              </div>
              <div className="tagList">
                {charaTags?.map((chara, i) => {
                  return (
                    <Link
                      to={"/character/" + chara.key}
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
                    item.query ?? { tags: item.value ?? "" }
                  );
                  switch (item.name) {
                    case "monthly":
                      search.set("monthMode", "tag");
                      break;
                  }
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
              <div className="gray right">
                <LikeButton />
                {image.time ? (
                  <span className="time">
                    {image.draft ? (
                      <span className="mr">（下書き）</span>
                    ) : null}
                    <span>{image.time.toLocaleString("ja", opt)}</span>
                  </span>
                ) : null}
                {image.embed && image.type === "ebook" ? (
                  <span>本のマークから読むことができる作品です！</span>
                ) : null}
                <ShareButton />
              </div>
              {image.copyright ? (
                <div className="gray right">
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
  const mediaOrigin = useMediaOrigin()[0];
  function MediaOrigin(src?: string) {
    return concatOriginUrl(mediaOrigin, src);
  }
  const imageUrl = useMemo(() => image.src || "", [image]);
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
                href={MediaOrigin(
                  imageUrl +
                    ((image.version || 1) > 1 ? "?v=" + image.version : "")
                )}
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
                ) : image.type ? (
                  <EmbedOpen embed={image.embed} type={image.type} />
                ) : null
              ) : null}
              <div className="wh-all-fill imageArea">
                <ImageMee
                  imageItem={image}
                  title={image.title || image.src || ""}
                />
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

interface EmbedOpenProps {
  embed?: string;
  type?: string;
  title?: string;
}
function EmbedOpen({ embed, type, title }: EmbedOpenProps) {
  if (!title) {
    if (type === "material") title = "素材をダウンロードする";
    else if (type === "pdf") title = "PDFを開く";
    else title = "ダウンロードする";
  }
  const mediaOrigin = useMediaOrigin()[0];
  const filesMap = useFilesMap()[0];
  const url = useMemo(() => {
    const src = embed ? filesMap?.get(embed)?.src : undefined;
    if (src !== undefined) return concatOriginUrl(mediaOrigin, src);
    else return "";
  }, [embed, filesMap]);
  return (
    <a
      title={title}
      href={url}
      target="_blank"
      className="open translucent-button"
    >
      {type === "material" ? (
        <MdMoveToInbox />
      ) : type === "pdf" ? (
        <RiFilePdf2Fill />
      ) : (
        <MdDownload />
      )}
    </a>
  );
}

export function ImageViewer() {
  const { imagesMap } = useImageState();
  const { isOpen, onOpen, onClose } = useImageViewer();
  const [isDirty, setIsDirty] = useImageEditIsDirty();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const l = useLocation();
  const state = l.state;
  const imageParam = searchParams.get("image");
  const setIsEdit = useImageEditIsEdit()[1];

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
    if (imagesMap && imageParam) {
      return imagesMap.get(imageParam);
    } else return;
  }, [imageParam, imagesMap]);

  useEffect(() => {
    if (image && (image.new || image.update)) {
      image.new = false;
      image.update = false;
    }
  }, [image]);

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
              className="modalClose cursor-pointer"
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
  const [searchParams, setSearchParams] = useSearchParams();
  const images = useImageViewer().images || [];
  const imageIndex = useMemo(() => {
    const key = image?.key;
    if (key) {
      return images.findIndex((groupImage) => groupImage.key === key);
    } else return -1;
  }, [image, images]);
  const { state } = useLocation();
  const escapeState = useMemo(() => {
    if (state) {
      const { from, ...escapeState } = state;
      return escapeState;
    } else return state;
  }, [state]);

  const prevNextImage = useMemo(
    () => ({
      before: images[imageIndex - 1],
      after: images[imageIndex + 1],
    }),
    [images, imageIndex]
  );
  const prevNextToHandler = function (image: ImageType) {
    const SearchParams = new URLSearchParams(searchParams);
    if (image.key) SearchParams.set("image", image.key);
    return new URL("?" + SearchParams.toString(), location.href).href;
  };
  useHotkeys("ArrowLeft", () => {
    if (prevNextImage.before) {
      setSearchParams(
        {
          ...Object.fromEntries(searchParams),
          image: prevNextImage.before.key,
        },
        { preventScrollReset: true, state: escapeState }
      );
    }
  });
  useHotkeys("ArrowRight", () => {
    if (prevNextImage.after) {
      setSearchParams(
        {
          ...Object.fromEntries(searchParams),
          image: prevNextImage.after.key,
        },
        { preventScrollReset: true, state: escapeState }
      );
    }
  });
  return (
    <div className={"paging" + (className ? ` ${className}` : "")} {...args}>
      {prevNextImage?.before ? (
        <Link
          className="prev"
          to={prevNextToHandler(prevNextImage.before)}
          preventScrollReset={true}
          state={escapeState}
        >
          <div className="cursor">≪</div>
          <div>{prevNextImage.before.title}</div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {prevNextImage?.after ? (
        <Link
          className="next"
          to={prevNextToHandler(prevNextImage.after)}
          preventScrollReset={true}
          state={escapeState}
        >
          <div>{prevNextImage.after.title}</div>
          <div className="cursor">≫</div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
