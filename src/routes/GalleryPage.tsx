import { useLocation, useParams } from "react-router-dom";
import { useImageState } from "../state/ImageState";
import { serverSite } from "../data/server/site";
import { ComicsViewer } from "../state/ComicsViewer";
import GalleryObject from "../components/image/GalleryObject";
import { useDataState } from "../state/StateSet";

export function GalleryPage({
  children,
}: {
  children?: React.ReactNode | string;
}) {
  return (
    <div className="galleryPage">
      <GalleryPageMain />
      {children}
    </div>
  );
}

function GalleryPageMain() {
  const s = new URLSearchParams(useLocation().search);
  const galleryDefault = serverSite.gallery?.default;
  const { isComplete } = useDataState();
  if (!isComplete) return <></>;
  if (s.has("ebook")) return <ComicsViewer src={s.get("ebook") || ""} />;
  return <GalleryObject items={galleryDefault} />;
}

export function GalleryGroupPage() {
  const { group } = useParams();
  console.log({ group });
  const item =
    serverSite.gallery?.generate?.find(
      (_group) => (typeof _group === "string" ? _group : _group.name) === group
    ) || group;
  return (
    <GalleryObject
      items={item}
      max={40}
      step={28}
      linkLabel={false}
      filterButton={true}
    />
  );
}
