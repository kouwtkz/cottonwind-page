import { useMemo } from "react";
import { GalleryManageMenuButton, GalleryObject } from "../GalleryPage";
import { useImageState } from "@/state/ImageState";

export function ImagesManager() {
  const { imageAlbums: albums } = useImageState();
  const items = useMemo(() => {
    return Object.values(Object.fromEntries(albums || []));
  }, [albums]);
  return (
    <main>
      <h2 className="color-main en-title-font">Images Manager</h2>
      <GalleryObject items={items} showInPageMenu={false} />
      <GalleryManageMenuButton />
    </main>
  );
}
