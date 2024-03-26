import { Link, useParams } from "react-router-dom";
import { ImageMeeIcon } from "../components/image/ImageMee";
import { useCharaState } from "../state/CharaState";
import { GalleryObject } from "./GalleryPage";
import { CharaType } from "../types/CharaType";
import { HTMLAttributes } from "react";
import { useImageState } from "../state/ImageState";

export function CharaPage() {
  const { charaList } = useCharaState();
  const { name: charaName } = useParams();
  return (
    <div className="charaPage">
      {charaName ? (
        <CharaDetail charaName={charaName} />
      ) : (
        <div className="list">
          {charaList.map((chara, i) => {
            return (
              <Link
                to={`/character/${chara.id}`}
                className="item"
                key={chara.id}
              >
                {chara.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CharaGalleryAlbumProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  chara: CharaType;
  label?: string;
  max?: number;
}

function CharaDetail({ charaName }: { charaName: string }) {
  const { charaObject } = useCharaState();
  const { imageAlbumList } = useImageState();
  if (!charaObject) return <></>;
  const chara = charaObject[charaName];
  const galleryList: CharaGalleryAlbumProps[] = [
    { chara, name: "art" },
    { chara, name: "goods" },
    { chara, name: "3D" },
    { chara, name: "picture" },
    { chara, name: "parody", label: "parody", max: 12 },
    { chara, name: "given", label: "Fanart", max: 40 },
  ];
  return (
    <>
      <div className="mb-4">
        <h1 className="text-main-strong font-bold text-3xl h-10 inline-block">
          {chara.media?.icon ? (
            <ImageMeeIcon
              imageItem={chara.media.icon}
              size={40}
              className="charaIcon text-4xl mr-2"
            />
          ) : null}
          <span className="align-middle">
            {chara.name + (chara.honorific ?? "")}
          </span>
        </h1>
        <div className="text-main text-xl my-2">{chara.overview}</div>
      </div>
      <div>{chara.description}</div>
      <GalleryObject
        items={galleryList.map((item) => {
          const matchAlbum = imageAlbumList.find(
            (album) => album.name === item.name
          );
          return {
            name: item.name,
            label: item.name,
            list: matchAlbum?.list.filter((image) =>
              image.tags?.some((tag) => tag === chara.id)
            ),
            filterButton: false,
          };
        })}
      />
    </>
  );
}
