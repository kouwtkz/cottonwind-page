import { useImageState } from "~/components/state/ImageState";
import { GalleryObject } from "./GalleryPage";
import ContactPage from "./ContactPage";
import { MeeLinks } from "./LinksPage";
import { useEffect, useMemo, useState } from "react";
import { findMee } from "~/data/find/findMee";
import {
  KeyValueEditable,
  KeyValueEditButton,
  KeyValueRenderProps,
} from "~/components/state/KeyValueDBState";

const LinksStyle: React.CSSProperties = {
  minHeight: "3em",
};
export default function WorksPage() {
  return (
    <div className="worksPage">
      <div className="color-main en-title-font">
        <h2>WORKS</h2>
        <h4>おしごとページ</h4>
      </div>
      <div className="status">
        <h2 className="color-main en-title-font">
          Status
          <KeyValueEditButton
            editEnvKey="VITE_KVDB_KEY_WORKS_STATUS"
            editType="textarea"
          />
        </h2>
        <KeyValueRenderProps
          editEnvKey="VITE_KVDB_KEY_WORKS_STATUS"
          editType="textarea"
        />
      </div>
      <WorksGallery />
      <MeeLinks
        title="Commission"
        category="commission"
        className="linkPage"
        banner
        linkStyle={LinksStyle}
      />
      <div className="price">
        <h2 className="color-main en-title-font">
          Price
          <KeyValueEditButton
            editEnvKey="VITE_KVDB_KEY_WORKS_PRICE"
            editType="textarea"
          />
        </h2>
        <KeyValueRenderProps
          editEnvKey="VITE_KVDB_KEY_WORKS_PRICE"
          editType="textarea"
        />
      </div>
      <ContactPage />
    </div>
  );
}

function WorksGallery() {
  const { images, galleryAlbums } = useImageState();
  const galleryResults = useMemo(() => {
    if (images) {
      return findMee(images, {
        where: {
          OR: [{ album: "works" }, { tags: { some: ["commission", "prize"] } }],
        },
      });
    } else return [];
  }, [images]);
  const gallery3D = useMemo(() => {
    if (galleryAlbums) {
      return galleryAlbums.find((v) => v.name === "3D") || null;
    } else return null;
  }, [galleryAlbums]);
  const groups = useMemo(() => {
    const list: GalleryItemObjectType[] = [
      {
        name: "Results",
        list: galleryResults,
        linkLabel: "/gallery?q=tags%3Acommission%2Cprize+OR+album%3Aworks",
      },
    ];
    if (gallery3D) {
      list.push({ ...gallery3D, label: "3D Sample" });
    }
    return list;
  }, [galleryResults, gallery3D]);
  return (
    <div className="gallery">
      <h2 className="color-main en-title-font">Gallery</h2>
      <GalleryObject
        items={groups}
        showInPageMenu={false}
        showGalleryHeader={false}
      />
    </div>
  );
}
