import { Link, useParams } from "react-router-dom";
import {
  ImageMee,
  ImageMeeIcon,
  ImageMeeThumbnail,
} from "../components/layout/ImageMee";
import { useCharaState } from "../state/CharaState";
import { GalleryObject } from "./GalleryPage";
import { CharaType } from "../types/CharaType";
import { HTMLAttributes, memo, useMemo } from "react";
import { useImageState } from "../state/ImageState";
import MultiParser from "../components/doc/MultiParser";
import { MakeRelativeURL } from "../components/doc/MakeURL";

export function CharaPage() {
  const { name: charaName } = useParams();
  return (
    <div className="charaPage">
      {charaName ? <CharaDetail charaName={charaName} /> : <CharaList />}
    </div>
  );
}

interface CharaGalleryAlbumProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  chara: CharaType;
  label?: string;
  max?: number;
}

const CharaList = memo(function CharaList() {
  const { charaList } = useCharaState();
  return (
    <div className="charaList">
      {charaList.map((chara, i) => {
        return (
          <Link to={`/character/${chara.id}`} className="item" key={chara.id}>
            <div>
              {chara.media?.image ? (
                <ImageMeeThumbnail
                  imageItem={chara.media.image}
                  className="image"
                  loadingScreen={true}
                />
              ) : null}
              <div className="name">{chara.name}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
});
const CharaBeforeAfter = memo(function CharaBeforeAfter({
  chara,
}: {
  chara: CharaType;
}) {
  const { charaList } = useCharaState();
  const charaIndex = charaList.findIndex(({ id }) => id === chara.id);
  const beforeChara = charaList[charaIndex - 1];
  const afterChara = charaList[charaIndex + 1];
  return (
    <div className="beforeAfter">
      <div className="before">
        {beforeChara ? (
          <Link
            to={"/character/" + beforeChara.id}
            className="flex items-center h-8"
          >
            <span className="cursor">＜</span>
            {beforeChara.media?.icon ? (
              <ImageMeeIcon
                imageItem={beforeChara.media.icon}
                size={40}
                className="charaIcon text-2xl mr-2"
              />
            ) : null}
            <span className="text-xl">{beforeChara.name}</span>
          </Link>
        ) : null}
      </div>
      <div className="after">
        {afterChara ? (
          <Link
            to={"/character/" + afterChara.id}
            className="flex items-center h-8"
          >
            {afterChara.media?.icon ? (
              <ImageMeeIcon
                imageItem={afterChara.media.icon}
                size={40}
                className="charaIcon text-2xl mr-2"
              />
            ) : null}
            <span className="text-xl">{afterChara.name}</span>
            <span className="cursor">＞</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
});

const CharaDetail = memo(function CharaDetail({
  charaName,
}: {
  charaName: string;
}) {
  const { charaObject } = useCharaState();
  const { imageAlbumList } = useImageState();
  const chara = useMemo(
    () => (charaObject ?? {})[charaName],
    [charaObject, charaName]
  );
  const galleryList: CharaGalleryAlbumProps[] = useMemo(
    () => [
      { chara, name: "art" },
      { chara, name: "goods" },
      { chara, name: "3D" },
      { chara, name: "picture" },
      { chara, name: "parody", max: 12 },
      { chara, name: "given", label: "Fanart", max: 40 },
    ],
    [chara]
  );
  return (
    <>
      {charaObject ? (
        <div className="charaDetail">
          <CharaBeforeAfter chara={chara} />
          <div className="head">
            <h1 className="title">
              {chara.media?.icon ? (
                <ImageMeeIcon
                  imageItem={chara.media.icon}
                  size={40}
                  className="charaIcon"
                />
              ) : null}
              <span>{chara.name + (chara.honorific ?? "")}</span>
            </h1>
            <div className="overview">{chara.overview}</div>
          </div>
          {chara.media?.headerImage ? (
            <div>
              <ImageMee
                imageItem={chara.media.headerImage}
                className="headerImage"
                loading="eager"
                suppressHydrationWarning={true}
              />
            </div>
          ) : null}
          {chara.media?.image ? (
            <div>
              <ImageMee
                imageItem={chara.media.image}
                className="mainImage"
                mode="thumbnail"
                loading="eager"
                suppressHydrationWarning={true}
                style={{ objectFit: "cover" }}
                height={340}
              />
            </div>
          ) : null}
          <MultiParser>{chara.description}</MultiParser>
          <GalleryObject
            items={galleryList
              .map((item) => {
                const matchAlbum = imageAlbumList.find(
                  (album) => album.name === item.name
                );
                return {
                  name: item.name,
                  label: item.name,
                  list:
                    matchAlbum?.list.filter((image) =>
                      image.tags?.some((tag) => tag === chara.id)
                    ) ?? [],
                };
              })
              .filter((item) => item.list?.length > 0)}
          />
        </div>
      ) : null}
    </>
  );
});
