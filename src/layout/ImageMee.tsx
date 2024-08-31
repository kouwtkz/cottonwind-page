import React, { ImgHTMLAttributes, useMemo, useRef, useState } from "react";
import { UrlObject } from "url";
import { GetUrlFlag, ToURL } from "@/functions/doc/MakeURL";

const blankSrc =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
interface BlankImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {}
export function BlankImage(args: BlankImageProps) {
  return <img {...args} src={blankSrc} />;
}

interface ImageMeeProps extends ImgHTMLAttributes<HTMLImageElement> {
  imageItem?: MediaImageItemType;
  hoverImageItem?: MediaImageItemType;
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
  ...attributes
}: ImageMeeProps) {
  const [showIndex, setShowIndex] = useState(0);
  const refImg = useRef<HTMLImageElement | null>(null);
  const refImgSrc = useRef("");
  const refShowList = useRef<string[]>([]);
  const isSetOrigin = originWhenDev && import.meta.env?.DEV;

  const src = _src || (isSetOrigin ? imageItem?.origin : imageItem?.URL) || "";
  const alt = _alt || imageItem?.name || imageItem?.src || "";

  [width, height] = useMemo(() => {
    if (size) {
      return new Array<number>(2).fill(size);
    } else if (imageItem?.size) {
      return [
        height
          ? Math.ceil((imageItem.size.w * Number(height)) / imageItem.size.h)
          : imageItem.size.w,
        width
          ? Math.ceil((imageItem.size.h * Number(width)) / imageItem.size.w)
          : imageItem.size.h,
      ];
    } else {
      return [width, height];
    }
  }, [imageItem, size, width, height]);
  const thumbnail = useMemo(
    () => imageItem?.resized?.find((item) => item.mode === "thumbnail")?.src,
    [imageItem]
  );
  const imageSrc = useMemo(
    () =>
      mode === "simple" || isSetOrigin
        ? src
        : mode === "thumbnail" && thumbnail
        ? thumbnail
        : imageItem?.resized?.find((item) => item.mode === mode)?.src || src,
    [imageItem, mode, src, thumbnail, isSetOrigin]
  );
  const imageShowList = useMemo(() => {
    const list: string[] = [];
    if (mode === "simple" && thumbnail) list.push(thumbnail);
    else list.push(blankSrc);
    list.push(imageSrc);
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

  return (
    <img
      src={mainImgSrc}
      alt={alt}
      ref={refImg}
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
  imageItem: MediaImageItemType;
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
  list: MediaImageItemType[];
}
export function GetImageItemFromSrc({ src, list }: GetImageItemFromSrcProps) {
  const Url = ToURL(src);
  const { host: hostFlag, pathname: pagenameFlag } = GetUrlFlag(Url);
  if (pagenameFlag) {
    const toSearch = Object.fromEntries(Url.searchParams);
    if ("image" in toSearch) {
      if (toSearch.dir) list = list.filter((item) => item.dir === toSearch.dir);
      if (toSearch.album)
        list = list.filter((item) => item.album?.name === toSearch.album);
      return list.find(({ originName }) =>
        originName?.startsWith(toSearch.image)
      );
    } else return null;
  } else if (hostFlag) {
    const _pathname = decodeURI(Url.pathname);
    return list.find((image) => image.URL?.match(_pathname));
  } else return null;
}

export function GetImageURLFromSrc({ src, list }: GetImageItemFromSrcProps) {
  const Url = ToURL(src);
  const { pathname: pagenameFlag } = GetUrlFlag(Url);
  const url = Url.href;
  const imageItem = GetImageItemFromSrc({ src: url, list });
  if (imageItem) return imageItem.URL;
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
