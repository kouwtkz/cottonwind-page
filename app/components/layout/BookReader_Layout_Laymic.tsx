import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useBookReaderState } from "./BookReader";

export function Layout_BookReader_Laymic({ pages }: { pages?: string[] }) {
  const { direction, orientation } = useBookReaderState();
  const { hash, state } = useLocation();
  const nav = useNavigate();
  const isHashLaymic = useMemo(() => hash === "#laymic", [hash]);
  const laymicContent = useMemo(() => {
    if (pages && pages.length > 0) {
      const laymicContent = new laymic.Laymic(
        { pages: pages, thumbs: [] },
        {
          isInstantOpen: false,
          isLTR: direction === "ltr",
          viewerDirection: orientation,
          classNames: {
            thumbs: {
              ...defaultLaymicClassNames.thumbs,
              wrapper: "laymic_thumbsWrapper window",
            },
          },
        },
      );
      return laymicContent;
    } else return null;
  }, [pages, direction, orientation]);
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
  return <></>;
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
