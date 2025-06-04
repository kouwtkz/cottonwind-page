import { useCallback, useEffect } from "react";
import { CreateObjectState, CreateState } from "./CreateState";
import { favLinksDataIndexed, linksDataIndexed } from "~/data/ClientDBLoader";
import { useImageState } from "./ImageState";
import { MeeIndexedDBTable } from "~/data/IndexedDB/MeeIndexedDB";
import { IndexedDataLastmodMH } from "~/data/IndexedDB/IndexedDataLastmodMH";

export type LinksIndexedDBType = IndexedDataLastmodMH<
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

async function callSetLinks({
  linksData,
  imagesMap,
}: {
  linksData: MeeIndexedDBTable<SiteLink>;
  imagesMap: imageMapType;
}) {
  const links = await linksData.getAll().then((list) => {
    return list
      .filter((data) => data.url || data.title || data.image)
      .map((data) => {
        if (data.image && imagesMap && imagesMap.has(data.image)) {
          data.Image = imagesMap.get(data.image)!;
        }
        return data;
      });
  });
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
  const { Set: setLinks } = useLinks();
  useEffect(() => {
    const linksData = linksDataIndexed.table;
    if (linksData?.db && imagesMap) {
      callSetLinks({ imagesMap, linksData }).then((result) => {
        setLinks(result);
      });
    }
  }, [linksDataIndexed, imagesMap]);
  const { Set: setFavLinks } = useFavLinks();
  useEffect(() => {
    const favLinksData = favLinksDataIndexed.table;
    if (favLinksData?.db && imagesMap) {
      callSetLinks({ imagesMap, linksData: favLinksData }).then((result) => {
        setFavLinks(result);
      });
    }
  }, [favLinksDataIndexed, imagesMap]);
  return <></>;
}
