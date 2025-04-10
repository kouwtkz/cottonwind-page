import { useCallback, useEffect, useSyncExternalStore } from "react";
import { CreateObjectState, CreateState } from "./CreateState";
import { favLinksDataIndexed, linksDataIndexed } from "@/data/DataState";
import { useImageState } from "./ImageState";
import { MeeIndexedDBTable } from "@/data/IndexedDB/MeeIndexedDB";
import { IndexedDataStateClass } from "@/data/IndexedDB/IndexedDataStateClass";

export type LinksIndexedDBType = IndexedDataStateClass<
  SiteLink,
  SiteLinkData,
  MeeIndexedDBTable<SiteLink>
>;
export type LinksMapType = Map<string, SiteLink[]>;
export interface LinksStateType {
  links?: SiteLink[];
  linksMap?: LinksMapType;
  linksData?: MeeIndexedDBTable<SiteLink>;
}
export const useLinks = CreateObjectState<LinksStateType>({});
export const useFavLinks = CreateObjectState<LinksStateType>({});
type imageMapType = Map<string, ImageType>;

function convertSiteLink(
  data: SiteLink | SiteLinkData,
  imagesMap?: Map<string, ImageType>
): SiteLink {
  const { url, draft, lastmod, ...other } = data;
  return {
    url: String(url),
    draft: typeof draft === "number" ? Boolean(draft) : undefined,
    lastmod: typeof lastmod === "string" ? new Date(lastmod) : lastmod,
    Image:
      other.image && imagesMap && imagesMap.has(other.image)
        ? imagesMap.get(other.image)!
        : undefined,
    ...other,
  };
}

async function callSetLinks({
  linksData,
  imagesMap,
}: {
  linksData: MeeIndexedDBTable<SiteLink>;
  imagesMap: imageMapType;
}) {
  const links = await linksData
    .getAll()
    .then((list) =>
      list
        .filter((data) => data.url || data.title || data.image)
        .map((data) => convertSiteLink(data, imagesMap))
    );
  const linksMap = links
    .filter((v) => v.url || v.title || v.image)
    .reduce<LinksMapType>((a, c) => {
      const category = c.category || "";
      if (a.has(category)) a.get(category)!.push(c);
      else a.set(category, [c]);
      return a;
    }, new Map());
  return {
    linksData,
    links,
    linksMap,
  };
}
export function LinksState() {
  const { imagesMap } = useImageState();
  const linksData = useSyncExternalStore(
    linksDataIndexed.subscribe,
    () => linksDataIndexed.table
  );
  const favLinksData = useSyncExternalStore(
    favLinksDataIndexed.subscribe,
    () => favLinksDataIndexed.table
  );
  const { Set: setLinks } = useLinks();
  useEffect(() => {
    if (linksData.db && imagesMap) {
      callSetLinks({ imagesMap, linksData }).then((result) => {
        setLinks(result);
      });
    }
  }, [linksData, imagesMap]);
  const { Set: setFavLinks } = useFavLinks();
  useEffect(() => {
    if (favLinksData.db && imagesMap) {
      callSetLinks({ imagesMap, linksData: favLinksData }).then((result) => {
        setFavLinks(result);
      });
    }
  }, [favLinksData, imagesMap]);
  return <></>;
}
