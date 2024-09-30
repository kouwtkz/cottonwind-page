import { useMemo } from "react";
import { useApiOrigin } from "@/state/EnvState";
import { GalleryObject } from "../GalleryPage";
import { useImageState } from "@/state/ImageState";
import { imageDataObject } from "@/state/DataState";

export function ImagesManager() {
  const { imageAlbums: albums } = useImageState();
  const apiOrigin = useApiOrigin()[0];
  const setLoad = imageDataObject.useLoad()[1];
  const items = useMemo(() => {
    return Object.values(Object.fromEntries(albums || []));
  }, [albums]);
  return (
    <main>
      <h2 className="color-main en-title-font">Images Manager</h2>
      <GalleryObject items={items} showInPageMenu={false} />
    </main>
  );
}
