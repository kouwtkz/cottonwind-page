import React, {
  ImgHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMediaOrigin } from "~/components/state/EnvState";
import { getExtension } from "~/components/functions/doc/PathParse";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { CreateState } from "~/components/state/CreateState";
import { resizeImageCanvas } from "~/components/Canvas";
import { useToastProgress } from "~/components/state/ToastProgress";
import { PiFilePng } from "react-icons/pi";
import { ModeSwitch } from "./edit/CommonSwitch";
import { useImageState } from "~/components/state/ImageState";

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

export interface ImageMeeProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  imageItem?: ImageType | string;
  hoverImageItem?: ImageType;
  mode?: ResizeMode;
  size?: number;
  loadingScreen?: boolean;
  v?: string | number;
  autoPixel?: boolean | number;
  showMessage?: boolean;
  autoPosition?: boolean;
  ref?: React.RefObject<HTMLImageElement>;
}
export function ImageMee({
  imageItem: _imageItem,
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
  autoPixel = true,
  loadingScreen = false,
  autoPosition = true,
  showMessage,
  style,
  onLoad,
  className,
  ref,
  ...attributes
}: ImageMeeProps) {
  const { imagesMap } = useImageState();
  const imageItem = useMemo(() => {
    if (typeof _imageItem === "string") {
      return imagesMap?.get(_imageItem) || null;
    } else {
      return _imageItem || null;
    }
  }, [_imageItem, imagesMap]);
  const mediaOrigin = useMediaOrigin()[0];
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

  const { addProgress, addMax } = useToastProgress();
  const ext = getExtension(imageItem?.src || _src || "");
  const src = (imageItem ? MediaOrigin(imageItem.src) : null) || _src || "";
  const alt = _alt || imageItem?.title || imageItem?.src || "";

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
  const avgSize = useMemo(
    () =>
      (Number(imageItem?.width || width) +
        Number(imageItem?.height || height)) /
      2,
    [imageItem, width, height]
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

  const thumbnail = useMemo(
    () => (imageItem?.thumbnail ? MediaOrigin(imageItem?.thumbnail) : null),
    [imageItem, MediaOrigin]
  );
  const imageSrc = useMemo(
    () =>
      showPng && pngURL
        ? pngURL
        : mode === "simple"
        ? src
        : mode === "thumbnail" && thumbnail
        ? thumbnail
        : imageItem && mode
        ? MediaOrigin((imageItem as unknown as KeyValueType<string>)[mode]) ||
          src
        : src,
    [imageItem, mode, src, thumbnail, showPng, pngURL]
  );
  const enableTempThumbnail = useMemo(
    () => Boolean(mode === "simple" && thumbnail),
    [mode, thumbnail]
  );
  const [tempThumbnail, setTempThumbnail] = useState(true);
  const currentTempThumbnail = useMemo(
    () => enableTempThumbnail && tempThumbnail,
    [enableTempThumbnail, tempThumbnail]
  );
  const mainImgSrc = useMemo(
    () => (currentTempThumbnail ? thumbnail : imageSrc),
    [imageSrc, thumbnail, currentTempThumbnail]
  );

  useEffect(
    () => () => {
      setPngURL(undefined);
      setTempThumbnail(true);
    },
    [imageItem, setPngURL, setTempThumbnail]
  );

  const _className = useMemo(() => {
    const list: string[] = [];
    if (className) list.push(className);
    if (!mainImgSrc) list.push("blank");
    if (
      autoPixel &&
      (typeof autoPixel === "number" ? autoPixel : 64) >= avgSize
    )
      list.push("pixel");
    return list.length > 0 ? list.join(" ") : undefined;
  }, [className, mainImgSrc, avgSize, autoPixel]);
  const imgStyle = useMemo(() => {
    const imgStyle: React.CSSProperties = { ...style };
    if (loadingScreen) {
      imgStyle.background = "var(--main-color-grayish-fluo)";
    }
    if (imageItem) {
      if (autoPosition && imageItem.position) {
        imgStyle.objectPosition = imageItem.position;
      }
    }
    return imgStyle;
  }, [imageItem, autoPosition, loadingScreen, style]);

  return (
    <img
      src={mainImgSrc || ""}
      alt={alt}
      ref={ref}
      data-origin-ext={ext}
      {...{
        width,
        height,
        style: imgStyle,
      }}
      className={_className}
      onLoad={(e) => {
        if (currentTempThumbnail) setTempThumbnail(false);
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
  showMessage?: boolean;
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

export function ImageMeeShowPngSwitch() {
  const showPng = useImageMeeShowPng()[0];
  return (
    <ModeSwitch
      toEnableTitle="画像をPNGファイルにする"
      useSwitch={useImageMeeShowPng}
      beforeOnClick={() => showPng || confirm("PNGで表示しますか？")}
    >
      <PiFilePng />
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
