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
        rendition.display().then(() => {
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
      console.log(metadata);
      const laymicContent = new laymic.Laymic(
        { pages: srcList, thumbs: [] },
        { isInstantOpen: false, isLTR: metadata?.direction === "ltr" }
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
