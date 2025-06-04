import { useImageState } from "~/components/state/ImageState";
import { GalleryObject } from "./GalleryPage";
import ContactPage from "./ContactPage";
import { MeeLinks } from "./LinksPage";
import { useMemo, useState } from "react";
import { findMee } from "~/data/find/findMee";

export default function WorksPage() {
  const { images } = useImageState();
  const list = useMemo(() => {
    if (images) {
      return findMee(images, {
        where: {
          OR: [{ album: "works" }, { tags: { contains: "comission" } }],
        },
      });
    } else return [];
  }, [images]);
  const groups: GalleryItemObjectType[] = [
    {
      name: "Gallery",
      list,
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
        showGalleryLabel={false}
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
