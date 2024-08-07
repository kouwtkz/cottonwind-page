import { Link, useParams, useSearchParams } from "react-router-dom";
import { ImageMee, ImageMeeIcon, ImageMeeThumbnail } from "@/layout/ImageMee";
import { CharaState, useCharaState } from "@/state/CharaState";
import { GalleryObject } from "./GalleryPage";
import { HTMLAttributes, memo, useEffect, useMemo, useState } from "react";
import { useImageState } from "@/state/ImageState";
import { MultiParserWithMedia } from "@/functions/doc/MultiParserWithMedia";
import CharaEditForm, {
  CharaEditButton,
  SortableObject,
  useEditSwitchState,
} from "../components/form/edit/CharaEdit";
import { ErrorContent } from "./ErrorPage";
import { useSoundPlayer } from "@/state/SoundPlayer";

export function CharaPage() {
  const { charaName } = useParams();
  const [search] = useSearchParams();
  const isEdit = search.get("edit") === "on";
  const isDev = import.meta.env.DEV;
  return (
    <div className="charaPage">
      <CharaState />
      {isDev && isEdit ? (
        <CharaEditForm />
      ) : (
        <>
          {isDev ? <CharaEditButton /> : null}
          {charaName ? <CharaDetail charaName={charaName} /> : <CharaList />}
        </>
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

export const CharaListItem = memo(function CharaListItem({
  chara,
  ...args
}: {
  chara: CharaType;
  className?: string;
}) {
  return (
    <div className="inner" {...args}>
      {chara.media?.image ? (
        <ImageMeeThumbnail
          imageItem={chara.media.image}
          className="image"
          loadingScreen={true}
        />
      ) : null}
      <div className="name">{chara.name}</div>
    </div>
  );
});
function CharaList() {
  const { charaList } = useCharaState();
  const [items, setItems] = useState(charaList);
  const { sortable } = useEditSwitchState();
  useEffect(() => {
    setItems(charaList);
  }, [charaList]);
  return (
    <>
      {import.meta.env.DEV ? (
        <SortableObject items={items} setItems={setItems} />
      ) : null}
      {sortable ? null : (
        <div className="charaList">
          {items.map((chara, i) => (
            <Link to={`/character/${chara.id}`} className="item" key={i}>
              <CharaListItem chara={chara} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
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
          <Link to={"/character/" + beforeChara.id} className="flex">
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
          <Link to={"/character/" + afterChara.id} className="flex">
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
  const { charaObject, isSet: isCharaState } = useCharaState();
  const { imageAlbumList } = useImageState().imageObject;
  const { RegistPlaylist } = useSoundPlayer();
  const chara = useMemo(
    () => (charaObject ?? {})[charaName],
    [charaObject, charaName]
  );
  const galleryList: CharaGalleryAlbumProps[] = useMemo(
    () =>
      chara
        ? [
            { chara, name: "art" },
            { chara, name: "goods" },
            { chara, name: "3D" },
            { chara, name: "picture" },
            { chara, name: "parody", max: 12 },
            { chara, name: "given", label: "Fanart", max: 40 },
          ]
        : [],
    [chara]
  );
  useEffect(() => {
    if (chara?.media?.playlist) {
      RegistPlaylist({ playlist: chara?.media?.playlist });
    }
  }, [chara?.media?.playlist?.title]);
  return (
    <>
      {isCharaState ? (
        chara ? (
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
            <MultiParserWithMedia>{chara.description}</MultiParserWithMedia>
            <GalleryObject
              items={galleryList
                .map((item) => {
                  const matchAlbum = imageAlbumList.find(
                    (album) => album.name === item.name
                  );
                  return {
                    name: item.name,
                    label: item.name,
                    tags: chara.id,
                    list:
                      matchAlbum?.list.filter((image) =>
                        image.tags?.some((tag) => tag === chara.id)
                      ) ?? [],
                  } as GalleryItemObjectType;
                })
                .filter((item) => item.list && item.list.length > 0)}
            />
          </div>
        ) : (
          <ErrorContent status={404} />
        )
      ) : null}
    </>
  );
});
