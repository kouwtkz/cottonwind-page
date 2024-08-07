import { useImageState } from "@/state/ImageState";
import { GalleryObject } from "./GalleryPage";
import ContactPage from "./ContactPage";

export default function WorksPage() {
  const { imageAlbumList } = useImageState().imageObject;
  const work = imageAlbumList.find((album) => album.name === "works");
  return (
    <div className="worksPage">
      <h2 className="lulo">WORKS</h2>
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
