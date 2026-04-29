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
import { Layout_BookReader_Laymic } from "./BookReader_Layout_Laymic";
import { CreateObjectState } from "../state/CreateState";

type BookReaderMode = "bookReader" | "laymic";

export function BookReader() {
  const { hash } = useLocation();
  const bookReaderMode = useMemo<BookReaderMode | undefined>(() => {
    switch (hash) {
      case "#bookReader":
        return "bookReader";
      case "#laymic":
        return "laymic";
    }
  }, [hash]);
  const { Set: SetBookReaderState } = useBookReaderState();
  useEffect(() => {
    SetBookReaderState({ enabled: Boolean(bookReaderMode), bookReaderMode });
  }, [bookReaderMode, SetBookReaderState]);

  return (
    <>
      <BookReader_Laymic />
      <BookReaderState />
    </>
  );
}

function BookReader_Laymic() {
  const { list, bookReaderMode } = useBookReaderState();
  const pages = useMemo(() => {
    if (bookReaderMode === "laymic")
      return list?.filter<string>((v) => typeof v === "string");
  }, [list, bookReaderMode]);
  return <Layout_BookReader_Laymic pages={pages} />;
}

export const useBookReaderState = CreateObjectState<BookReaderStateType>({});

export function BookReaderState() {
  const { Set: SetBookReaderState, enabled } = useBookReaderState();
  const backRenderElm = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams()[0];
  const { filesMap } = useFiles();
  const { image } = useImageViewer();
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
  const mode = useMemo(() => {
    if (/\.epub/i.test(url)) return "epub";
    else if (/\.zip/i.test(url)) return "zip";
  }, [url]);
  const [metadata, setMetadata] = useState<ePubMetadataType | null>(null);
  useEffect(() => {
    (async () => {
      if (enabled) {
        if (mode === "epub" && backRenderElm.current) {
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
                      }),
                  ),
              ).then((newAssets) => {
                const pages = newAssets.map(({ type, url, href }, i) =>
                  type.startsWith("image") ? (
                    url
                  ) : (
                    <iframe
                      style={{ width: "100%", height: "100%", margin: "auto" }}
                      title={href}
                      key={`bookReader_iframe_${i}_${href}`}
                      src={url}
                    />
                  ),
                );
                SetBookReaderState({ list: pages });
              });
            }
          });
        } else if (mode === "zip") {
          const reading = toast("読み込み中…");
          const zip = new JSZip();
          fetch(url)
            .then((r) => r.arrayBuffer())
            .then((file) =>
              zip.loadAsync(file).then((value) => {
                Promise.all(
                  Object.entries(value.files)
                    .filter(
                      ([K, v]) =>
                        !v.dir && /\.(png|jpe?g|gif|webp)$/.test(v.name),
                    )
                    .map(([k, v], i) => {
                      return { name: k, content: v.async("blob") };
                    })
                    .map<Blob>((v) => v.content),
                ).then((list) => {
                  const pages = list.map((blob) => URL.createObjectURL(blob));
                  SetBookReaderState({ list: pages });
                });
              }),
            )
            .finally(() => {
              toast.dismiss(reading);
            });
        }
      } else {
        SetBookReaderState({ list: null });
      }
    })();
  }, [url, mode, enabled, SetBookReaderState]);
  const orientation = useMemo<ViewerOrientationType | undefined>(() => {
    switch (mode) {
      case "epub":
        return "horizontal";
      case "zip":
        return "vertical";
    }
  }, [mode]);
  useEffect(() => {
    SetBookReaderState({
      orientation,
      direction: metadata?.direction,
    });
  }, [orientation, metadata, SetBookReaderState]);
  return (
    <>
      <div ref={backRenderElm} style={{ display: "none" }} />
    </>
  );
}
