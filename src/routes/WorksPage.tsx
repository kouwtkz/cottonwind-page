import { useImageState } from "@/state/ImageState";
import { GalleryObject } from "./GalleryPage";
import ContactPage from "./ContactPage";
import { MeeLinks } from "./LinksPage";

export default function WorksPage() {
  const images = useImageState().images || [];
  const groups: GalleryItemObjectType[] = [
    {
      name: "Gallery",
      list: images.filter(
        (image) =>
          image.album === "works" ||
          image.tags?.find((tag) => tag === "commission")
      ),
      linkLabel: "/gallery?q=tags%3Acommission+OR+album%3Aworks",
    },
  ];
  return (
    <div className="worksPage">
      <h2 className="color-main en-title-font">Works</h2>
      <GalleryObject
        items={groups}
        showInPageMenu={false}
        showGalleryHeader={false}
        // showGalleryLabel={false}
      />
      <MeeLinks
        title="コミッション"
        category="commission"
        className="linkPage"
        banner
        linkStyle={{ minHeight: "3em" }}
      />
      <ContactPage />
    </div>
  );
}
