import { useAtom } from "jotai";
import { imageAlbumsAtom } from "@/state/ImageState";
import { GalleryObject } from "./GalleryPage";
import ContactPage from "./ContactPage";

export default function WorksPage() {
  const imageAlbumList = useAtom(imageAlbumsAtom)[0];
  const work = imageAlbumList?.get("works");
  return (
    <div className="worksPage">
      <h2 className="color en-title-font">Works</h2>
      {work ? (
        <GalleryObject
          items={[work]}
          showInPageMenu={false}
          showGalleryHeader={false}
          showGalleryLabel={false}
        />
      ) : null}
      <ContactPage />
    </div>
  );
}
