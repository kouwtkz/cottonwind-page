import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ImageMee,
  ImageMeeIcon,
  ImageMeeQuestion,
  ImageMeeThumbnail,
} from "@/layout/ImageMee";
import {
  useCharacters,
  useCharactersMap,
  useCharacterTags,
} from "@/state/CharacterState";
import { GalleryObject } from "./GalleryPage";
import { HTMLAttributes, memo, useEffect, useMemo, useRef } from "react";
import { useImageState } from "@/state/ImageState";
import { MultiParserWithMedia } from "@/components/parse/MultiParserWithMedia";
import {
  CharacterEdit,
  CharaEditButton,
  SortableObject,
  useEditSwitchState,
} from "./edit/CharacterEdit";
import { ErrorContent } from "./ErrorPage";
import { useSoundPlayer } from "@/state/SoundPlayer";
import { useHotkeys } from "react-hotkeys-hook";
import { findMee, setWhere } from "@/functions/find/findMee";
import { ContentsTagsSelect } from "@/components/dropdown/SortFilterReactSelect";
import {
  ContentsTagsOption,
  defineSortTags,
} from "@/components/dropdown/SortFilterTags";
import { useIsLogin } from "@/state/EnvState";

export function CharacterPage() {
  const { charaName } = useParams();
  const searchParams = useSearchParams()[0];
  const isEdit = searchParams.get("edit") === "on";
  const isLogin = useIsLogin()[0];
  return (
    <div className="characterPage">
      {isLogin && isEdit ? (
        <CharacterEdit />
      ) : (
        <>
          {isLogin ? <CharaEditButton /> : null}
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
  chara: CharacterType;
  label?: string;
  max?: number;
}

export const CharaListItem = memo(function CharaListItem({
  chara,
  ...args
}: {
  chara: CharacterType;
  className?: string;
}) {
  return (
    <>
      <div className="inner" {...args}>
        {chara.media?.image ? (
          <ImageMeeThumbnail
            imageItem={chara.media.image}
            className="image"
            loadingScreen={true}
          />
        ) : chara.media?.icon ? (
          <ImageMeeThumbnail
            imageItem={chara.media.icon}
            className="image"
            loadingScreen={true}
          />
        ) : (
          <ImageMeeQuestion alt={chara.name} />
        )}
      </div>
      <div className="name">{chara.name}</div>
    </>
  );
});

function CharaListPage() {
  const characters = useCharacters()[0];
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const text = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
  const isLogin = useIsLogin()[0];
  const tags = useMemo(
    () => searchParams.get("tags")?.split(","),
    [searchParams]
  );
  const filters = useMemo(
    () => searchParams.get("filter")?.split(","),
    [searchParams]
  );
  const showAll = useMemo(
    () => isLogin || filters?.some((v) => v === "showAll"),
    [filters, isLogin]
  );
  const whereOptions = useMemo(
    () =>
      setWhere<CharacterType>(text, {
        text: {
          key: ["name", "id", "overview", "description", "honorific"],
        },
        hashtag: { key: "tags" },
      }),
    [text]
  );
  const { orderBy } = whereOptions;
  const wheres = [whereOptions.where];
  const tagsWhere = useMemo(() => {
    if (tags)
      return {
        AND: tags.map((tag) => ({
          tags: {
            contains: tag,
          },
        })),
      };
    else return null;
  }, [tags]);
  if (tagsWhere) wheres.push(tagsWhere);
  const filterDraft = useMemo(
    () => filters?.some((v) => v === "draft"),
    [filters]
  );
  if (filterDraft) wheres.push({ draft: true });
  const where: findWhereType<CharacterType> = { AND: wheres };
  const sortParam = searchParams.get("sort");
  const orderBySort = useMemo(() => {
    const list: OrderByItem<CharacterType>[] = [...orderBy];
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
  const items = useMemo(() => {
    let list = characters
      ? findMee({ list: [...characters], where, orderBy: orderBySort })
      : [];
    if (!showAll) list = list.filter((chara) => chara.visible);
    return list;
  }, [where, characters, orderBySort, showAll]);
  const { sortable } = useEditSwitchState();
  return (
    <>
      <CharaSearchArea />
      {isLogin ? <SortableObject /> : null}
      <div className="charaList" hidden={sortable}>
        {items.map((chara, i) => (
          <Link
            to={`/character/${chara.key}`}
            state={{
              ...(state ?? {}),
              characterSort: orderBySort,
              charaTagsWhere: tagsWhere,
              charaFilters: filters,
              backUrl: location.href,
            }}
            className="item"
            key={chara.key}
          >
            <CharaListItem chara={chara} />
          </Link>
        ))}
      </div>
    </>
  );
}

interface CharaBeforeAfterProps extends HTMLAttributes<HTMLDivElement> {
  charaName?: string;
}
export function CharaBeforeAfter({
  charaName,
  className,
  ...props
}: CharaBeforeAfterProps) {
  const charactersMap = useCharactersMap()[0];
  const chara = useMemo(
    () => charactersMap?.get(charaName || ""),
    [charactersMap, charaName]
  );
  const characters = useCharacters()[0];
  const { state } = useLocation();
  const searchParams = useSearchParams()[0];
  const isEdit = searchParams.get("edit") === "on";
  const isLogin = useIsLogin()[0];
  const filters: string[] | undefined = useMemo(
    () => state?.charaFilters,
    [state]
  );
  const showAll = useMemo(
    () => isLogin || filters?.some((v) => v === "showAll"),
    [filters, isLogin]
  );
  const items = useMemo(() => {
    let list = characters!;
    const characterSort = state?.characterSort;
    const charaTagsWhere: findWhereType<CharacterType> | undefined =
      state?.charaTagsWhere;
    if (characterSort || charaTagsWhere) {
      list = [...list];
      const wheres: findWhereType<CharacterType>[] = [];
      if (charaTagsWhere) wheres.push(charaTagsWhere);
      list = findMee({
        list,
        orderBy: state.characterSort,
        where: { AND: wheres },
      });
    }
    if (!showAll) list = list.filter((chara) => chara.visible);
    return list;
  }, [characters, state, showAll]);
  const charaIndex = useMemo(
    () => (chara ? items.findIndex(({ key: id }) => id === chara?.key) : -1),
    [items, chara]
  );
  const { beforeChara, afterChara } = useMemo(() => {
    if (charaIndex >= 0) {
      return {
        beforeChara: items[charaIndex - 1],
        afterChara: items[charaIndex + 1],
      };
    } else {
      return { beforeChara: null, afterChara: null };
    }
  }, [items, charaIndex]);
  return (
    <div className={"beforeAfter" + (className ? " " + className : "")}>
      <div className="before" {...props}>
        {beforeChara ? (
          <Link
            to={"/character/" + beforeChara.key + (isEdit ? "?edit=on" : "")}
            state={state}
          >
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
      <div className="after" {...props}>
        {afterChara ? (
          <Link
            to={"/character/" + afterChara.key + (isEdit ? "?edit=on" : "")}
            state={state}
          >
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
}

const defaultGalleryList = [
  { name: "art" },
  { name: "goods" },
  { name: "3D" },
  { name: "picture" },
  { name: "parody", max: 12 },
  { name: "given", label: "Fanart", max: 40 },
] as GalleryItemType[];
function CharaDetail({ charaName }: { charaName: string }) {
  const charactersMap = useCharactersMap()[0];
  const { imageAlbums: albums } = useImageState();
  const searchParams = useSearchParams()[0];
  const showAllAlbum = searchParams.has("showAllAlbum");
  const galleryList = useMemo(() => {
    const list = [...defaultGalleryList];
    if (showAllAlbum && albums) {
      albums.forEach((value, key) => {
        if (list.every(({ name }) => name !== key))
          list.push({ ...value, name: key });
      });
    }
    return list;
  }, [albums, defaultGalleryList, showAllAlbum]);
  const { RegistPlaylist } = useSoundPlayer();
  const chara = useMemo(
    () => charactersMap?.get(charaName),
    [charactersMap, charaName]
  );
  useEffect(() => {
    if (chara?.media?.playlist) {
      RegistPlaylist({ playlist: chara?.media?.playlist });
    }
  }, [chara?.media?.playlist?.title]);
  return (
    <>
      {charactersMap ? (
        chara ? (
          <div className="charaDetail">
            <CharaBeforeAfter charaName={charaName} />
            {chara.draft ? (
              <div className="color-gray">（下書き中のキャラクター）</div>
            ) : null}
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
              items={galleryList.map((item) => {
                const albumImages = albums?.get(item.name)?.list || [];
                return {
                  name: item.name,
                  label: item.name,
                  character: chara.key,
                  list:
                    albumImages.filter((image) =>
                      image.characters?.some((name) => name === chara.key)
                    ) ?? [],
                } as GalleryItemObjectType;
              })}
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
  const characterTags = useCharacterTags()[0];
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useLocation();
  const isLogin = useIsLogin()[0];
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
  const tags = useMemo(() => {
    const charaFilterOptions: ContentsTagsOption = {
      label: "フィルタ",
      name: "filter",
      options: [{ label: "🔬全て表示", value: "filter:showAll" }],
    };
    if (isLogin) {
      charaFilterOptions.options!.push({
        value: "filter:draft",
        label: "📝下書き",
      });
    }
    const charaTagsOptions: ContentsTagsOption = {
      label: "タグ",
      name: "tags",
      options: characterTags,
    };
    return characterSortTags.concat(charaFilterOptions, charaTagsOptions);
  }, [characterTags, isLogin]);

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
      <ContentsTagsSelect tags={tags} />
    </div>
  );
}
