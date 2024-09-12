import React, {
  ImgHTMLAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { UrlObject } from "url";
import { GetUrlFlag, ToURL } from "@/functions/doc/MakeURL";
import { useAtom } from "jotai";
import { MediaOriginAtom } from "@/state/EnvState";
import { getExtension } from "@/functions/doc/PathParse";
import { concatOriginUrl } from "@/functions/originUrl";

const blankSrc =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
interface BlankImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {}
export function BlankImage({ className, ...args }: BlankImageProps) {
  return (
    <img
      {...args}
      className={"blank" + (className ? " " + className : "")}
      src={blankSrc}
    />
  );
}

interface ImageMeeProps extends ImgHTMLAttributes<HTMLImageElement> {
  imageItem?: ImageType;
  hoverImageItem?: ImageType;
  mode?: ResizeMode;
  size?: number;
  loadingScreen?: boolean;
  originWhenDev?: boolean;
  v?: string | number;
}
export function ImageMee({
  imageItem,
  mode = "simple",
  alt: _alt,
  src: _src,
  hoverImageItem,
  loading,
  srcSet,
  size,
  width,
  height,
  v,
  loadingScreen = false,
  originWhenDev = false,
  style,
  onLoad,
  className,
  ...attributes
}: ImageMeeProps) {
  const [showIndex, setShowIndex] = useState(0);
  const refImg = useRef<HTMLImageElement | null>(null);
  const refImgSrc = useRef("");
  const refShowList = useRef<(string | null)[]>([]);
  const isSetOrigin = originWhenDev;

  const mediaOrigin = useAtom(MediaOriginAtom)[0];
  const versionString = useMemo(() => {
    if (imageItem)
      return (imageItem.version || 1) > 1 ? "?v=" + imageItem.version : "";
    else return "";
  }, [imageItem?.version]);
  const MediaOrigin = useCallback(
    (src?: OrNull<string>) => {
      let url = concatOriginUrl(mediaOrigin, src);
      if (url) url = url + versionString;
      return url;
    },
    [mediaOrigin, versionString]
  );

  const ext = getExtension(_src || imageItem?.src || "");
  const src =
    _src ||
    (imageItem
      ? MediaOrigin(
          isSetOrigin ? imageItem.src : imageItem.webp || imageItem.src
        )
      : null) ||
    "";
  const alt = _alt || imageItem?.name || imageItem?.src || "";

  [width, height] = useMemo(() => {
    if (size) {
      return new Array<number>(2).fill(size);
    } else if (imageItem?.width && imageItem?.height) {
      return [
        height
          ? Math.ceil((imageItem.width * Number(height)) / imageItem.height)
          : imageItem.width,
        width
          ? Math.ceil((imageItem.height * Number(width)) / imageItem.width)
          : imageItem.height,
      ];
    } else {
      return [width, height];
    }
  }, [imageItem, size, width, height]);
  const iconOnly = useMemo(
    () =>
      imageItem &&
      imageItem.icon &&
      !imageItem.src &&
      !imageItem.webp &&
      !imageItem.webp,
    [imageItem]
  );
  const thumbnail = useMemo(
    () => MediaOrigin(imageItem?.thumbnail || imageItem?.icon),
    [imageItem, MediaOrigin]
  );

  const imageSrc = useMemo(
    () =>
      mode === "simple" || isSetOrigin
        ? src
        : mode === "thumbnail" && thumbnail
        ? thumbnail
        : MediaOrigin((imageItem as unknown as KeyValueType<string>)[mode]) ||
          src,
    [imageItem, mode, src, thumbnail, isSetOrigin]
  );
  const imageShowList = useMemo(() => {
    const list: (string | null)[] = [];
    if (mode === "simple" && thumbnail) list.push(thumbnail);
    else list.push(null);
    if (imageSrc) list.push(imageSrc);
    return list;
  }, [imageSrc, mode, thumbnail]);
  const max = useMemo(() => {
    return imageShowList.length - 1;
  }, [imageShowList.length]);

  if (refImgSrc.current !== src) {
    setShowIndex(0);
    refImgSrc.current = src;
    refShowList.current = imageShowList;
  }
  const mainImgSrc = imageShowList[showIndex];
  const _className = useMemo(() => {
    const list: string[] = [];
    if (className) list.push(className);
    if (!mainImgSrc) list.push("blank");
    if (iconOnly) list.push("pixel");
    return list.length > 0 ? list.join(" ") : undefined;
  }, [className, mainImgSrc, iconOnly]);
  return (
    <img
      src={mainImgSrc || blankSrc}
      alt={alt}
      ref={refImg}
      data-origin-ext={ext}
      {...{
        width,
        height,
        style: {
          ...style,
          ...(loadingScreen
            ? { background: "var(--main-color-grayish-fluo)" }
            : {}),
        },
      }}
      className={_className}
      onLoad={(e) => {
        if (showIndex < max) setShowIndex(showIndex + 1);
        else if (onLoad) onLoad(e);
      }}
      {...attributes}
    />
  );
}

interface ImageMeeSimpleProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageItem: ImageType;
  size?: number;
  loadingScreen?: boolean;
  originWhenDev?: boolean;
}

export function ImageMeeIcon({ size, ...args }: ImageMeeSimpleProps) {
  return ImageMee({ ...args, mode: "icon" });
}
export function ImageMeeThumbnail({ size, ...args }: ImageMeeSimpleProps) {
  return ImageMee({ ...args, mode: "thumbnail" });
}

interface GetImageItemFromSrcProps {
  src: string | UrlObject | URL;
  list: ImageType[];
}
export function GetImageItemFromSrc({ src, list }: GetImageItemFromSrcProps) {
  const Url = ToURL(src);
  const { host: hostFlag, pathname: pagenameFlag } = GetUrlFlag(Url);
  if (pagenameFlag) {
    const toSearch = Object.fromEntries(Url.searchParams);
    if ("image" in toSearch) {
      if (toSearch.album)
        list = list.filter((item) => item.albumObject?.name === toSearch.album);
      return list.find(({ name }) => name?.startsWith(toSearch.image));
    } else return null;
  } else if (hostFlag) {
    const _pathname = decodeURI(Url.pathname);
    return list.find((image) => image.src?.match(_pathname));
  } else return null;
}

export function GetImageURLFromSrc({ src, list }: GetImageItemFromSrcProps) {
  const Url = ToURL(src);
  const { pathname: pagenameFlag } = GetUrlFlag(Url);
  const url = Url.href;
  const imageItem = GetImageItemFromSrc({ src: url, list });
  if (imageItem) return imageItem.src;
  if (pagenameFlag) return "";
  else return url;
}

interface ImgSwitchProps
  extends React.DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  > {
  hoverSrc?: string;
  v?: string | number;
}

export function ImgSwitch({
  src,
  hoverSrc,
  className,
  v,
  ...args
}: ImgSwitchProps) {
  let queryStr = v ? "?v=" + v : "";
  className = className ? className + " " : "";
  return (
    <div className="switch-img">
      {src ? (
        <img src={src + queryStr} className={className + "normal"} {...args} />
      ) : null}
      {hoverSrc ? (
        <img
          src={hoverSrc + queryStr}
          className={className + "hover"}
          {...args}
        />
      ) : null}
    </div>
  );
}
