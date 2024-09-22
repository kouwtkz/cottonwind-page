import { useImageState } from "@/state/ImageState";
import { GalleryObject } from "./GalleryPage";
import ContactPage from "./ContactPage";

export default function WorksPage() {
  const { imageAlbums } = useImageState();
  const work = imageAlbums?.get("works");
  return (
    <div className="worksPage">
      <h2 className="color-main en-title-font">Works</h2>
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
