import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImageState } from "~/components/state/ImageState";
import { useHotkeys } from "react-hotkeys-hook";
import { GalleryObject } from "~/page/GalleryPage";
// import ComicViewer from "react-comic-viewer";
import { useSearchParams } from "react-router";
import { useMediaOrigin } from "~/components/state/EnvState";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { useFiles } from "~/components/state/FileState";
import { findMee } from "~/data/find/findMee";

interface ePubMetadataType {
  title?: string;
  creator?: string;
  description?: string;
  direction?: "rtl" | "ltr";
  pubdate?: string;
  publisher?: string;
  identifier?: string;
  language?: string;
  rights?: string;
  modified_date?: string;
  layout?: string;
  orientation?: string;
  flow?: string;
  viewport?: string;
  spread?: string;
}

export function ComicsViewer() {
  const s = useSearchParams()[0];
  const src = s.get("name") ?? "";
  if (src)
    if (/\.epub$/i.test(src)) {
      return <EPubViewer src={src} />;
    } else return <></>;
  else return <EBookGallery />;
}

function EBookGallery() {
  const { images } = useImageState();
  const [ebooks, setebooks] = useState<ImageType[]>([]);
  useEffect(() => {
    if (images) setebooks(findMee(images, { index: "type", query: "ebook" }));
  }, [images]);
  return (
    <GalleryObject
      items={[
        {
          name: "comics",
          label: "comics",
          list: ebooks,
        },
      ]}
    />
  );
}

export function EPubViewer({ src }: { src: string }) {
  const [srcList, setSrcList] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<ePubMetadataType | null>(null);
  const backRenderElm = useRef<HTMLDivElement>(null);
  const mediaOrigin = useMediaOrigin()[0];
  const { filesMap } = useFiles();
  const url = useMemo(() => {
    const file = filesMap?.get(src);
    return file?.src ? concatOriginUrl(mediaOrigin, file.src) : undefined;
  }, [mediaOrigin, src, filesMap]);
  useEffect(() => {
    (async () => {
      if (!url || !backRenderElm.current) return;
      const book = ePub(url);
      const rendition = book.renderTo(backRenderElm.current);
      console.log(book);
      rendition.display().then(() => {
        setMetadata(book.packaging.metadata);
        const resources = book.resources as any;
        if ("assets" in resources) {
          const assets = resources.assets as any[];
          Promise.all(
            assets
              .filter(({ type }) => type !== "text/css")
              .map(
                (item) =>
                  new Promise<any>((resolve) => {
                    (resources.get(item.href) as Promise<string>).then(
                      (url) => {
                        resolve({ url, ...item });
                      }
                    );
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
    })();
  }, [url]);
  return (
    <>
      <div ref={backRenderElm} style={{ display: "none" }} />
      <Viewer pages={srcList} metadata={metadata} type="epub" />
    </>
  );
}

function Viewer({
  pages,
  type,
  fix = true,
  pageShow = true,
  metadata,
}: {
  pages: any[];
  fix?: boolean;
  pageShow?: boolean;
  type?: "epub" | "album";
  metadata?: ePubMetadataType | null;
}) {
  const nRef = useRef(0);
  const [divHeight, setDivHeight] = useState<number>();
  const [fixCover, setFixCover] = useState(false);
  const rcvRef = useRef<HTMLDivElement>(null);
  const rcv = rcvRef.current;
  const [divElm, setDivElm] = useState<Element | null>();
  useEffect(() => {
    setDivElm(rcv?.querySelector(`div[height]`));
  }, [rcv]);
  useEffect(() => {
    if (!divElm) return;
    const updateSize = () => {
      const h = divElm.getAttribute("height");
      if (h) setDivHeight(Number(h));
    };
    updateSize();
    const observer = new MutationObserver(updateSize);
    observer.observe(divElm, {
      attributes: true,
      attributeFilter: ["height"],
    });
    return () => {
      observer.disconnect();
    };
  }, [divElm]);
  const [setedFixCover, setSetedFixCover] = useState(false);
  useEffect(() => {
    if (!divElm) return;
    const updateSize = (setedFix = false): void => {
      if (divHeight) {
        setFixCover(divElm.clientWidth >= divHeight);
        if (setedFix) setSetedFixCover(true);
      }
    };
    updateSize(pageShow);
    window.addEventListener("resize", () => updateSize());
    return () => {
      window.removeEventListener("resize", () => updateSize());
    };
  }, [divHeight, divElm, pageShow]);
  const [setedMetadata, setSetedMetadata] = useState(false);
  useEffect(() => {
    if (metadata) setSetedMetadata(true);
  }, [metadata]);

  const _pages = useMemo(() => {
    if (!setedFixCover || !setedMetadata) return [];
    if (fix && fixCover) return [<div key="cover" />].concat(pages);
    else return pages;
  }, [fix, fixCover, pages, setedFixCover, setedMetadata]);
  const toNext = useCallback(() => {
    if (_pages.length !== nRef.current + 1) {
      const pagingElm = document.querySelector(
        `.react-comic-viewer a[direction]:nth-of-type(1)`
      );
      if (pagingElm) (pagingElm as HTMLAnchorElement).click();
    }
  }, [_pages.length]);
  const toPrev = useCallback(() => {
    if (nRef.current > 0) {
      const pagingElm = document.querySelector(
        `.react-comic-viewer a[direction]:nth-last-of-type(1)`
      );
      if (pagingElm) (pagingElm as HTMLAnchorElement).click();
    }
  }, []);
  useHotkeys("left", () => {
    if (metadata?.direction === "ltr") toPrev();
    else toNext();
  });
  useHotkeys("right", () => {
    if (metadata?.direction === "ltr") toNext();
    else toPrev();
  });

  return (
    <>
      <div
        className={"react-comic-viewer" + (setedFixCover ? "" : " loading")}
        ref={rcvRef}
      >
        {/* <ComicViewer
          pages={_pages}
          direction={metadata?.direction}
          onChangeCurrentPage={(n) => (nRef.current = n)}
          text={{
            expansion: "かくだい",
            fullScreen: "ぜんがめん",
            move: "いどう",
            normal: "もとにもどす",
          }}
        /> */}
      </div>
      <div className="mt-6 [&_*]:mx-2">
        {metadata === null ? (
          <span>よみこみちゅう…</span>
        ) : metadata ? (
          <>
            {metadata.title ? <span>{metadata.title}</span> : null}
            {metadata.title && metadata.creator ? <span>-</span> : null}
            {metadata.creator ? <span>{metadata.creator}</span> : null}
          </>
        ) : null}
      </div>
      <div className="mt-6">
        <p>
          Powered by{" "}
          <a
            href="https://www.npmjs.com/package/react-comic-viewer"
            target="_blank"
            rel="noopener"
          >
            react-comic-viewer
          </a>
          {type === "epub" ? (
            <>
              {" & "}
              <a
                href="https://www.npmjs.com/package/epubjs"
                target="_blank"
                rel="noopener"
              >
                Epub.js
              </a>
            </>
          ) : null}
        </p>
      </div>
    </>
  );
}
