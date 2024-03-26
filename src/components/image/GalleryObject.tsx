import { Suspense, createRef } from "react";
import GalleryList, { GalleryListPropsBase } from "./GalleryList";
import { GroupFormat } from "../../types/MediaImageYamlType";
import { getBasename } from "../doc/PathParse";
import { MediaImageAlbumType } from "../../types/MediaImageDataType";
import InPageMenu from "../layout/InPageMenu";
import ArrowUpButton from "../svg/button/arrow/ArrowUpButton";
import { filterPickFixed } from "./FilterImages";
import GalleryTagsSelect from "../tag/GalleryTagsSelect";
import GallerySearchArea from "../tag/GallerySearchArea";
import { useImageState } from "../../state/ImageState";

export interface GalleryItemObjectType extends GalleryListPropsBase {
  name: string;
  match?: string | RegExp;
  format?: GroupFormat;
}

export type GalleryItemType = string | GalleryItemObjectType;

export type GalleryItemsType = GalleryItemType | GalleryItemType[];

interface GalleryItemProps extends GalleryListPropsBase {
  item: GalleryItemObjectType;
}

function GalleryItem({ item, ...args }: GalleryItemProps) {
  const { imageItemList, imageAlbumList } = useImageState();
  const loading = imageAlbumList.length === 0;
  const { name, match, format = "image", ..._args } = item;
  const setArgs = {
    max: 20,
    filterButton: true,
    linkLabel: true,
    ...args,
    ..._args,
  };
  if (format === "comic") {
    const comicsAlbums = match
      ? imageAlbumList.filter((album) => {
          return (
            album.dir &&
            album.dir.match(match) &&
            album.list.some((img) => img.dir?.startsWith("/content"))
          );
        })
      : imageAlbumList.filter((album) => album.name === name);
    imageAlbumList.find((album) => album.dir?.match(name));
    const thumbnails = comicsAlbums.map((album) => {
      const thumbnail = {
        ...(album.list.find((image) => image.src.startsWith("thumbnail")) ||
          album.list[0]),
      };
      thumbnail.embed = getBasename(album.name);
      thumbnail.type = "ebook";
      return thumbnail;
    });
    const album: MediaImageAlbumType = { name, list: thumbnails };
    return <GalleryList album={album} loading={loading} {...setArgs} />;
  } else {
    switch (name) {
      case "pickup":
      case "topImage":
        return (
          <GalleryList
            album={{
              list: filterPickFixed({ images: imageItemList, name }),
              name,
            }}
            loading={loading}
            hideWhenFilter={true}
            {...setArgs}
          />
        );
      default:
        let groupAlbum = match
          ? imageAlbumList.find((album) => album.dir?.match(match))
          : imageAlbumList.find((album) => album.name === name);
        if (!groupAlbum) groupAlbum = { name, list: [] };
        return (
          <GalleryList album={groupAlbum} loading={loading} {...setArgs} />
        );
    }
  }
}

interface GalleryObjectProps extends GalleryListPropsBase {
  items?: GalleryItemsType;
}

export default function GalleryObject({
  items = [],
  ...args
}: GalleryObjectProps) {
  const isDev = import.meta.env.DEV;
  const list = (Array.isArray(items) ? items : [items]).map((item) =>
    typeof item === "string" ? { name: item } : item
  );
  const firstTopRef = createRef<HTMLDivElement>();
  const refList = list.map(() => createRef<HTMLDivElement>());
  return (
    <>
      {list.length > 1 ? (
        <InPageMenu
          list={list.map(({ name, label }, i) => ({
            name: label || name,
            ref: refList[i],
          }))}
          firstTopRef={firstTopRef}
          adjust={128}
        />
      ) : isDev ? (
        list.map((item, i) => {
          switch (item.name) {
            case "pickup":
            case "topImage":
              return null;
          }
          return (
            <div className="rbButtonArea z30" key={i}>
              <button
                type="button"
                className="round large"
                title="アップロードする"
                onClick={() => {
                  const uploadElm =
                    document.querySelector(`input[name="upload"]`);
                  if (uploadElm) (uploadElm as HTMLInputElement).click();
                }}
              >
                <ArrowUpButton />
              </button>
            </div>
          );
        })
      ) : null}
      <div ref={firstTopRef}>
        <Suspense>
          <div className="galleryHeader">
            <GallerySearchArea />
            <GalleryTagsSelect />
          </div>
        </Suspense>
        {list.map((item, i) => (
          <div key={i} ref={refList[i]}>
            <GalleryItem item={item} {...args} />
          </div>
        ))}
      </div>
    </>
  );
}
