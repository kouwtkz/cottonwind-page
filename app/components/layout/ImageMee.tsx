import React, {
  type ImgHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getExtension } from "~/components/functions/doc/PathParse";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { CreateState } from "~/components/state/CreateState";
import { resizeImageCanvas } from "~/components/Canvas";
import { useToastProgress } from "~/components/state/ToastProgress";
import { PiFilePng } from "react-icons/pi";
import { ModeSwitch } from "./edit/CommonSwitch";
import { useImageState } from "~/components/state/ImageState";
import { mediaOrigin } from "~/data/ClientDBLoader";
import { useImageViewer } from "./ImageViewer";
import { useNavigate } from "react-router";

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

export const useImageMeeShowPng = CreateState(false);

function setupSrc(imageItem?: ImageType | null, src?: string | null) {
  if (imageItem?.src) {
    if (/https?:\/\//.test(imageItem.src)) return imageItem.src;
    else return concatOriginUrl(mediaOrigin, imageItem.src);
  } else return src || "";
}
export interface ImageMeeProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  thumbnail?: string | null;
  imageItem?: ImageType | string;
  hoverImageItem?: ImageType;
  mode?: ResizeMode;
  size?: number;
  loadingScreen?: boolean;
  v?: string | number;
  autoPixel?: boolean | number;
  showMessage?: boolean;
  autoPosition?: boolean | string;
  isCover?: boolean;
  ref?: React.RefObject<HTMLImageElement | null>;
  wideImageClass?: string;
  longImageClass?: string;
  squareImageClass?: string;
  enableLink?: boolean;
}
export const ImageMee = React.memo(function ImageMee({
  imageItem: _imageItem,
  mode = "simple",
  alt: _alt,
  src: _src,
  thumbnail: _thumbnail,
  hoverImageItem,
  loading,
  srcSet,
  size,
  width: _width,
  height: _height,
  v,
  autoPixel = true,
  loadingScreen = false,
  autoPosition = true,
  isCover,
  showMessage,
  style,
  onLoad,
  wideImageClass = "wideImage",
  longImageClass = "longImage",
  squareImageClass = "squareImage",
  className,
  ref,
  enableLink,
  ...attributes
}: ImageMeeProps) {
  const { srcMap, imagesMap } = useImageState();
  const imageItem = useMemo(() => {
    if (_imageItem && typeof _imageItem === "object") return _imageItem;
    let href = _imageItem || _src;
    if (href) {
      href = decodeURI(href);
      return srcMap?.get(href) || imagesMap?.get(href) || null;
    } else {
      return null;
    }
  }, [_src, _imageItem, imagesMap, srcMap]);
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
    [mediaOrigin, versionString],
  );

  const { addProgress, addMax } = useToastProgress();
  const ext = getExtension(imageItem?.src || _src || "");
  const src =
    useMemo(() => setupSrc(imageItem, _src), [imageItem, _src]) + versionString;
  const alt = _alt || imageItem?.title || imageItem?.src || "";

  const [width, height] = useMemo(() => {
    if (size) {
      return new Array<number>(2).fill(size);
    } else if (imageItem?.width && imageItem?.height) {
      return [
        _height
          ? Math.ceil((imageItem.width * Number(_height)) / imageItem.height)
          : imageItem.width,
        _width
          ? Math.ceil((imageItem.height * Number(_width)) / imageItem.width)
          : imageItem.height,
      ];
    } else {
      return [
        _width ? Number(_width) : undefined,
        _height ? Number(_height) : undefined,
      ];
    }
  }, [imageItem, size, _width, _height]);
  const avgSize = useMemo(
    () =>
      (Number(imageItem?.width || width) +
        Number(imageItem?.height || height)) /
      2,
    [imageItem, width, height],
  );

  const [statePngURL, setPngURL] = useState<string>();
  const pngURL = useMemo(() => {
    const src = imageItem?.src || "";
    if (/\.png(\??.*|)$/i.test(src)) return MediaOrigin(src);
    else return statePngURL;
  }, [statePngURL, imageItem, MediaOrigin]);
  const showPng = useImageMeeShowPng()[0];
  useEffect(() => {
    if (showPng && !pngURL) {
      if (showMessage)
        addMax({
          message: "PNGに変換しています",
          success: "完了しました",
          autoClose: 750,
        });
      resizeImageCanvas({ src, type: "png" }).then((blob) => {
        if (showMessage) addProgress();
        setPngURL(URL.createObjectURL(blob));
      });
    }
  }, [showMessage, showPng, pngURL, setPngURL, addProgress, addMax]);

  const thumbnail = useMemo(() => {
    const thumbnail = _thumbnail || imageItem?.thumbnail;
    if (thumbnail) {
      if (/https?:\/\//.test(thumbnail)) return thumbnail;
      else return MediaOrigin(thumbnail);
    } else return null;
  }, [_thumbnail, imageItem, MediaOrigin]);
  const imageSrc = useMemo(
    () =>
      showPng && pngURL
        ? pngURL
        : mode === "simple"
          ? src
          : mode === "thumbnail" && thumbnail
            ? thumbnail
            : imageItem && mode
              ? MediaOrigin(
                  (imageItem as unknown as KeyValueType<string>)[mode],
                ) || src
              : src,
    [imageItem, mode, src, thumbnail, showPng, pngURL],
  );
  const enableTempThumbnail = useMemo(
    () => Boolean(mode === "simple" && thumbnail),
    [mode, thumbnail],
  );
  const [tempThumbnail, setTempThumbnail] = useState(true);
  const currentTempThumbnail = useMemo(
    () => enableTempThumbnail && tempThumbnail,
    [enableTempThumbnail, tempThumbnail],
  );
  const mainImgSrc = useMemo(
    () => (currentTempThumbnail ? thumbnail : imageSrc),
    [imageSrc, thumbnail, currentTempThumbnail],
  );

  useEffect(
    () => () => {
      setPngURL(undefined);
      setTempThumbnail(true);
    },
    [imageItem, setPngURL, setTempThumbnail],
  );

  const _className = useMemo(() => {
    const list: string[] = [];
    if (className) list.push(className);
    if (!mainImgSrc) list.push("blank");
    if (
      autoPixel &&
      (typeof autoPixel === "number" ? autoPixel : 64) >= avgSize
    ) {
      list.push("pixel");
    }
    if (width && height) {
      if (width === height) {
        list.push(squareImageClass);
      } else if (width > height) {
        list.push(wideImageClass);
      } else {
        list.push(longImageClass);
      }
    }
    return list.length > 0 ? list.join(" ") : undefined;
  }, [
    className,
    mainImgSrc,
    avgSize,
    autoPixel,
    wideImageClass,
    longImageClass,
    squareImageClass,
    width,
    height,
  ]);
  const imgStyle = useMemo(() => {
    const imgStyle: React.CSSProperties = { ...style };
    if (loadingScreen) {
      imgStyle.background = "var(--main-color-grayish-fluo)";
    }
    if (imageItem) {
      const autoPositionIsString = typeof autoPosition === "string";
      if (autoPosition && (imageItem.position || autoPositionIsString)) {
        let splited = (
          autoPositionIsString ? autoPosition : imageItem.position!
        ).split(" ");
        splited = splited.filter((v) => {
          if (v === "null") return false;
          if (v === "contain") {
            if (!isCover) imgStyle!.objectFit = "contain";
            return false;
          } else return true;
        });
        if (splited.length !== 0) {
          if (!imgStyle!.objectFit) imgStyle.objectPosition = splited.join(" ");
        }
      }
    }
    return imgStyle;
  }, [imageItem, autoPosition, loadingScreen, style, isCover]);

  const inner = (
    <img
      src={mainImgSrc || ""}
      alt={alt}
      ref={ref}
      data-origin-ext={ext}
      key={imageSrc}
      width={width}
      height={height}
      style={imgStyle}
      className={_className}
      onLoad={(e) => {
        if (currentTempThumbnail) setTempThumbnail(false);
        else if (onLoad) onLoad(e);
      }}
      {...attributes}
    />
  );
  return (
    <>
      {enableLink ? (
        <ImageMeeLink
          imageItem={imageItem}
          src={src}
          thumbnail={thumbnail}
          alt={alt}
          width={width}
          height={height}
        >
          {inner}
        </ImageMeeLink>
      ) : (
        inner
      )}
    </>
  );
});

interface ImageMeeLinkProps
  extends Omit<ImageMeeProps, "width" | "height" | "imageItem"> {
  imageItem?: ImageType | null;
  width?: number;
  height?: number;
}
export const ImageMeeLink = React.memo(function ImageMeeLinkProps({
  id,
  alt,
  src,
  thumbnail,
  children,
  width,
  height,
  imageItem: _imageItem,
}: ImageMeeLinkProps) {
  const { setOpen: setOpenImageViewer } = useImageViewer();
  const nav = useNavigate();
  const imageItem: ImageType = useMemo(
    () =>
      _imageItem || {
        id: -1,
        key: id || "",
        title: alt,
        src,
        thumbnail,
        hideInfo: true,
        width,
        height,
      },
    [_imageItem, src, thumbnail, id, alt, width, height],
  );
  const directMode = imageItem.id < 0;
  const ImageOnClick = useCallback(
    (e: React.UIEvent<HTMLElement, unknown>) => {
      e.preventDefault();
      if (directMode) {
        setOpenImageViewer({ image: imageItem });
      } else {
        setOpenImageViewer({ images: null });
        const searchParams = new URLSearchParams(location.search);
        searchParams.set("image", imageItem.key);
        nav(
          {
            search: searchParams.toString(),
          },
          { preventScrollReset: true },
        );
      }
    },
    [directMode, imageItem],
  );
  return (
    <a
      href={src || ""}
      target="_blank"
      onClick={ImageOnClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") ImageOnClick(e);
      }}
    >
      {children}
    </a>
  );
});

interface ImageMeeSimpleProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageItem?: ImageType;
  thumbnail?: string;
  size?: number;
  loadingScreen?: boolean;
  showMessage?: boolean;
  autoPosition?: boolean | string;
  isCover?: boolean;
  enableLink?: boolean;
}

export function ImageMeeIcon({ size, ...args }: ImageMeeSimpleProps) {
  return <ImageMee autoPixel={false} {...args} mode="icon" />;
}
export function ImageMeeThumbnail({ size, ...args }: ImageMeeSimpleProps) {
  return <ImageMee {...args} mode="thumbnail" />;
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
        <img src={src + queryStr} className={className + "usually"} {...args} />
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

export function ImageMeeShowPngSwitch({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const showPng = useImageMeeShowPng()[0];
  return (
    <ModeSwitch
      toEnableTitle="画像をPNGファイルにする"
      useSwitch={useImageMeeShowPng}
      beforeOnClick={() => showPng || confirm("PNGで表示しますか？")}
      className={className}
    >
      <PiFilePng />
      {children}
    </ModeSwitch>
  );
}

export function ImageMeeQuestion(args: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/static/images/svg/question.svg"
      width={500}
      height={500}
      {...args}
    />
  );
}
