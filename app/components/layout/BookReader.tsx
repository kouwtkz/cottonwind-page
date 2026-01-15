import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useFiles } from "../state/FileState";
import { concatOriginUrl } from "../functions/originUrl";
import { mediaOrigin } from "~/data/ClientDBLoader";
import { useImageViewer } from "./ImageViewer";
import { toast } from "react-toastify";

export function BookReader() {
  const { hash, state } = useLocation();
  const searchParams = useSearchParams()[0];
  const [srcList, setSrcList] = useState<any[] | null>(null);
  const [metadata, setMetadata] = useState<ePubMetadataType | null>(null);
  const backRenderElm = useRef<HTMLDivElement>(null);
  const { filesMap } = useFiles();
  const { image } = useImageViewer();
  const nav = useNavigate();
  const src = useMemo(() => {
    return searchParams.get("ebook") || image?.embed;
  }, [searchParams, image]);
  const file = useMemo(() => {
    if (src) return filesMap?.get(src);
  }, [src, filesMap]);
  const url = useMemo(() => {
    if (file?.src) return concatOriginUrl(mediaOrigin, file.src);
    else return "";
  }, [file, mediaOrigin]);
  const isHashLaymic = useMemo(() => hash === "#laymic", [hash]);
  useEffect(() => {
    (async () => {
      if (isHashLaymic && /\.epub/i.test(url) && backRenderElm.current) {
        const book = ePub(url);
        const rendition = book.renderTo(backRenderElm.current);
        const reading = toast("読み込み中…");
        rendition.display().then(() => {
          toast.dismiss(reading);
          setMetadata(book.packaging.metadata);
          const resources = book.resources;
          if ("assets" in resources) {
            const assets = resources.assets;
            Promise.all(
              assets
                .filter(({ type }) => type !== "text/css")
                .map(
                  (item) =>
                    new Promise<any>((resolve) => {
                      resources.get(item.href).then((url) => {
                        resolve({ url, ...item });
                      });
                    })
                )
            ).then((newAssets) => {
              const pages = newAssets.map(({ type, url, href }, i) =>
                type.startsWith("image") ? (
                  url
                ) : (
                  <iframe
                    style={{ width: "100%", height: "100%", margin: "auto" }}
                    title={href}
                    key={i}
                    src={url}
                  />
                )
              );
              setSrcList(pages);
            });
          }
        });
      } else {
        setSrcList(null);
      }
    })();
  }, [url, isHashLaymic]);
  const laymicContent = useMemo(() => {
    if (srcList) {
      const laymicContent = new laymic.Laymic(
        { pages: srcList, thumbs: [] },
        {
          isInstantOpen: false,
          isLTR: metadata?.direction === "ltr",
          classNames: {
            thumbs: {
              ...defaultLaymicClassNames.thumbs,
              wrapper: "laymic_thumbsWrapper window",
            },
          },
        }
      );
      return laymicContent;
    } else return null;
  }, [srcList, metadata]);
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    (globalThis as any).laymicContent = laymicContent;
    if (laymicContent) {
      const observer = new MutationObserver((callback) => {
        if (laymicContent.el.rootEl.style.visibility === "visible") {
          setIsActive(true);
        } else {
          setIsActive(false);
        }
      });
      observer.observe(laymicContent.el.rootEl, { attributes: true });
      laymicContent.open();
      return () => {
        observer.disconnect();
      };
    }
  }, [laymicContent]);
  const refIsActive = useRef(isActive);
  useEffect(() => {
    if (refIsActive.current && !isActive) {
      if (state?.from && !/#laymic$/.test(String(state.from))) {
        nav(-1);
      } else {
        const Url = new URL(location.href);
        nav(Url.pathname + Url.search, {
          preventScrollReset: true,
          state,
        });
      }
    }
    refIsActive.current = isActive;
  }, [isActive, state]);
  useEffect(() => {
    if (laymicContent && isActive && !isHashLaymic) {
      refIsActive.current = false;
      laymicContent.close();
    }
  }, [laymicContent, isActive, isHashLaymic]);
  return (
    <>
      <div ref={backRenderElm} style={{ display: "none" }} />
    </>
  );
}

const defaultLaymicClassNames = {
  root: "laymic_root",
  slider: "laymic_slider",
  // uiボタンクラス名
  uiButton: "laymic_uiButton",
  // 空スライドクラス名
  emptySlide: "laymic_emptySlide",
  pagination: "laymic_pagination",
  controller: {
    controller: "laymic_controller",
    controllerTop: "laymic_controllerTop",
    controllerBottom: "laymic_controllerBottom",
  },
  buttons: {
    direction: "laymic_direction",
    fullscreen: "laymic_fullscreen",
    thumbs: "laymic_showThumbs",
    preference: "laymic_showPreference",
    close: "laymic_close",
    help: "laymic_showHelp",
    nextPage: "laymic_paginationNext",
    prevPage: "laymic_paginationPrev",
    zoom: "laymic_zoom",
    progressbar: "laymic_progressbar",
  },
  svg: {
    icon: "laymic_svgIcon",
    defaultProp: "laymic_svgDefaultProp",
    container: "laymic_svgContainer",
  },
  checkbox: {
    container: "laymic_checkbox",
    label: "laymic_checkboxLabel",
    iconWrapper: "laymic_checkboxIconWrapper",
  },
  select: {
    container: "laymic_select",
    label: "laymic_selectLabel",
    wrapper: "laymic_selectWrapper",
    current: "laymic_selectCurrentItem",
    item: "laymic_selectItem",
    itemWrapper: "laymic_selectItemWrapper",
  },
  thumbs: {
    container: "laymic_thumbs",
    wrapper: "laymic_thumbsWrapper",
    item: "laymic_thumbItem",
    slideThumb: "laymic_slideThumb",
    imgThumb: "laymic_imgThumb",
    lazyload: "laymic_lazyload",
    lazyloading: "laymic_lazyloading",
    lazyloaded: "laymic_lazyloaded",
  },
  preference: {
    container: "laymic_preference",
    wrapper: "laymic_preferenceWrapper",
    notice: "laymic_preferenceNotice",
    button: "laymic_preferenceButton",
    paginationVisibility: "laymic_preferencePaginationVisibility",
    isAutoFullscreen: "laymic_preferenceIsAutoFullscreen",
    zoomButtonRatio: "laymic_preferenceZoomButtonRatio",
    isDisabledTapSlidePage: "laymic_preferenceIsDisabledTapSlidePage",
    isDisabledForceHorizView: "laymic_preferenceIsDisabledForceHorizView",
    isDisabledDoubleTapResetZoom:
      "laymic_preferenceIsDisabledDoubleTapResetZoom",
  },
  help: {
    container: "laymic_help",
    wrapper: "laymic_helpWrapper",
    vertImg: "laymic_helpVertImg",
    horizImg: "laymic_helpHorizImg",
    innerWrapper: "laymic_helpInnerWrapper",
    innerItem: "laymic_helpInnerItem",
    iconWrapper: "laymic_helpIconWrapper",
    iconLabel: "laymic_helpIconLabel",
    chevronsContainer: "laymic_helpChevrons",
    zoomItem: "laymic_helpZoomItem",
    fullscreenItem: "laymic_helpFullscreenItem",
  },
  zoom: {
    controller: "laymic_zoomController",
    wrapper: "laymic_zoomWrapper",
  },
};
