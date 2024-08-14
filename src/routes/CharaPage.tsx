import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ImageMee, ImageMeeIcon, ImageMeeThumbnail } from "@/layout/ImageMee";
import { CharaState, useCharaState } from "@/state/CharaState";
import { GalleryObject } from "./GalleryPage";
import { HTMLAttributes, memo, useEffect, useMemo, useRef } from "react";
import { useImageState } from "@/state/ImageState";
import { MultiParserWithMedia } from "@/functions/doc/MultiParserWithMedia";
import CharaEditForm, {
  CharaEditButton,
  SortableObject,
  useEditSwitchState,
} from "./edit/CharaEdit";
import { ErrorContent } from "./ErrorPage";
import { useSoundPlayer } from "@/state/SoundPlayer";
import { useHotkeys } from "react-hotkeys-hook";
import { findMany, setWhere } from "@/functions/findMany";
import { ContentsTagsSelect } from "@/components/dropdown/SortFilterReactSelect";
import { defineSortTags } from "@/components/dropdown/SortFilterTags";

export function CharaPage() {
  const { charaName } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "on";
  const isDev = import.meta.env.DEV;
  return (
    <div id="characterPage">
      <CharaState />
      {isDev && isEdit ? (
        <CharaEditForm />
      ) : (
        <>
          {isDev ? <CharaEditButton /> : null}
          {charaName ? (
            <CharaDetail charaName={charaName} />
          ) : (
            <CharaListPage />
          )}
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
      ) : (
        <img
          src="/static/images/svg/question.svg"
          alt={chara.name}
          width={500}
          height={500}
        />
      )}
      <div className="name">{chara.name}</div>
    </div>
  );
});

function CharaListPage() {
  const { charaList, isSet } = useCharaState();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const text = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
  const { where, orderBy } = useMemo(
    () =>
      setWhere(text, {
        text: {
          key: ["name", "id", "overview", "description", "honorific"],
        },
        hashtag: { key: "tags" },
      }),
    [text]
  );
  const sortParam = searchParams.get("sort");
  const orderBySort = useMemo(() => {
    const list: OrderByItem<CharaType>[] = [...orderBy];
    const searchSort = sortParam ?? "";
    switch (searchSort) {
      case "recently":
        list.push({ time: "desc" });
        break;
      case "leastRecently":
        list.push({ time: "asc" });
        break;
      case "nameOrder":
        list.push({ name: "asc" });
        break;
      case "leastNameOrder":
        list.push({ name: "desc" });
        break;
    }
    return list;
  }, [sortParam, orderBy]);
  const items = useMemo(
    () =>
      isSet
        ? findMany({ list: [...charaList], where, orderBy: orderBySort })
        : [],
    [where, charaList, orderBySort, isSet]
  );
  const { sortable } = useEditSwitchState();
  return (
    <>
      <CharaSearchArea />
      {import.meta.env.DEV ? <SortableObject /> : null}
      <div className="charaList" hidden={sortable}>
        {items.map((chara, i) => (
          <Link
            to={`/character/${chara.id}`}
            state={{ ...(state ?? {}), characterSort: orderBySort }}
            className="item"
            key={i}
          >
            <CharaListItem chara={chara} />
          </Link>
        ))}
      </div>
    </>
  );
}
const CharaBeforeAfter = memo(function CharaBeforeAfter({
  chara,
}: {
  chara: CharaType;
}) {
  const { charaList } = useCharaState();
  const { state } = useLocation();
  const items = useMemo(
    () =>
      state?.characterSort
        ? findMany({ list: [...charaList], orderBy: state.characterSort })
        : charaList,
    [charaList, state]
  );
  const charaIndex = items.findIndex(({ id }) => id === chara.id);
  const beforeChara = items[charaIndex - 1];
  const afterChara = items[charaIndex + 1];
  return (
    <div className="beforeAfter">
      <div className="before">
        {beforeChara ? (
          <Link to={"/character/" + beforeChara.id} state={state}>
            <span className="cursor">＜</span>
            {beforeChara.media?.icon ? (
              <ImageMeeIcon
                imageItem={beforeChara.media.icon}
                size={40}
                className="charaIcon"
              />
            ) : null}
            <span>{beforeChara.name}</span>
          </Link>
        ) : null}
      </div>
      <div className="after">
        {afterChara ? (
          <Link to={"/character/" + afterChara.id} state={state}>
            {afterChara.media?.icon ? (
              <ImageMeeIcon
                imageItem={afterChara.media.icon}
                size={40}
                className="charaIcon"
              />
            ) : null}
            <span>{afterChara.name}</span>
            <span className="cursor">＞</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
});

function CharaDetail({ charaName }: { charaName: string }) {
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
              submitPreventScrollReset={true}
            />
          </div>
        ) : (
          <ErrorContent status={404} />
        )
      ) : null}
    </>
  );
}

interface CharaSearchAreaProps {}
const characterSortTags = [
  defineSortTags(["nameOrder", "leastNameOrder", "recently", "leastResently"]),
];
export function CharaSearchArea({}: CharaSearchAreaProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation();
  const confirmUrl = useMemo(() => state?.confirmUrl, [state]);
  function setConfirmUrl() {
    nav(location, {
      replace: true,
      preventScrollReset: true,
      state: { ...(state || {}), confirmUrl: location.href },
    });
  }
  useEffect(() => {
    if (!confirmUrl || searchParams.size === 0) setConfirmUrl();
  }, [confirmUrl, searchParams.size]);
  const nav = useNavigate();
  const isImeOn = useRef(false);
  useHotkeys("slash", (e) => {
    searchRef.current?.focus();
    e.preventDefault();
  });
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === searchRef.current) {
        searchRef.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT"] }
  );
  function setText(value: string) {
    const newSearchParams = createSearchParams(searchParams);
    if (value) newSearchParams.set("q", value);
    else newSearchParams.delete("q");
    const addReplace: { replace: boolean; state?: any } = {
      replace: location.href !== confirmUrl,
    };
    if (!addReplace.replace) {
      const _state = state ? { ...state } : {};
      addReplace.state = _state;
      _state.beforeSearchParams = searchParams.toString();
    }
    if (state?.beforeSearchParams === newSearchParams.toString()) {
      nav(-1);
    } else {
      setSearchParams(newSearchParams, {
        preventScrollReset: true,
        state,
        ...addReplace,
      });
    }
  }
  return (
    <div className="header">
      <input
        name="q"
        type="search"
        className="search"
        placeholder="キャラクター検索"
        ref={searchRef}
        onChange={() => {
          if (searchRef.current && !isImeOn.current) {
            setText(searchRef.current.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            (document.activeElement as HTMLElement)?.blur();
        }}
        onBlur={() => {
          setConfirmUrl();
        }}
        onCompositionStart={() => {
          isImeOn.current = true;
        }}
        onCompositionEnd={() => {
          isImeOn.current = false;
          if (searchRef.current) setText(searchRef.current.value);
        }}
      />
      <ContentsTagsSelect tags={characterSortTags} />
    </div>
  );
}
