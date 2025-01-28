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
import {
  HTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useImageState } from "@/state/ImageState";
import { MultiParserWithMedia } from "@/components/parse/MultiParserWithMedia";
import { CharacterEdit, CharaEditButton } from "./edit/CharacterEdit";
import { ErrorContent } from "./ErrorPage";
import { useSoundPlayer } from "@/state/SoundPlayer";
import { useHotkeys } from "react-hotkeys-hook";
import { findMee, setWhere } from "@/functions/find/findMee";
import { ContentsTagsSelect } from "@/components/dropdown/SortFilterReactSelect";
import {
  ContentsTagsOption,
  defineSortTags,
} from "@/components/dropdown/SortFilterTags";
import { useApiOrigin, useIsLogin } from "@/state/EnvState";
import { CreateState } from "@/state/CreateState";
import { Movable } from "@/layout/edit/Movable";
import { toast } from "react-toastify";
import axios from "axios";
import { concatOriginUrl } from "@/functions/originUrl";
import { charactersDataObject } from "@/state/DataState";
import { create } from "zustand";
import { getInitialString } from "@/functions/InitialString";

interface CharacterStateType {
  filters?: string[];
  showAll?: boolean;
  where?: findWhereType<CharacterType>;
  tagsWhere?: findWhereType<CharacterType> | null;
  orderBySort?: OrderByItem<CharacterType>[];
}
interface CharacterStateTypeProps extends CharacterStateType {
  set: (args: CharacterStateType) => void;
}
export const useCharacterPageState = create<CharacterStateTypeProps>(
  (_set) => ({
    set(args) {
      _set(args);
    },
  })
);
function CharacterPageState() {
  const searchParams = useSearchParams()[0];
  const isLogin = useIsLogin()[0];
  const filters = useMemo(
    () => searchParams.get("filter")?.split(","),
    [searchParams]
  );
  const showAll = useMemo(
    () => isLogin || filters?.some((v) => v === "showAll"),
    [filters, isLogin]
  );
  const text = useMemo(() => {
    const textArray: Array<string> = [];
    if (searchParams.has("q")) textArray.push(searchParams.get("q")!);
    if (searchParams.has("tags"))
      textArray.push("tags:" + searchParams.get("tags")!);
    return textArray.join(" ");
  }, [searchParams]);
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
  const wheres = useMemo(() => [whereOptions.where], [whereOptions.where]);
  const filterDraft = useMemo(
    () => filters?.some((v) => v === "draft"),
    [filters]
  );
  if (filterDraft) wheres.push({ draft: true });
  const where: findWhereType<CharacterType> = useMemo(
    () => ({ AND: wheres }),
    [wheres]
  );
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
  const { set } = useCharacterPageState();
  useEffect(() => {
    set({ filters, orderBySort, showAll, where });
  }, [set, filters, orderBySort, showAll, where]);
  return <></>;
}

export function CharacterPage() {
  const { charaName } = useParams();
  const searchParams = useSearchParams()[0];
  const isEdit = searchParams.get("edit") === "on";
  const isLogin = useIsLogin()[0];
  return (
    <div className="characterPage">
      <CharacterPageState />
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

export const useMoveCharacters = CreateState(0);
function CharaListPage() {
  const characters = useCharacters()[0];
  const { filters, orderBySort, showAll, where } = useCharacterPageState();
  const { state } = useLocation();

  const parts = useMemo(() => {
    let items = characters
      ? findMee([...characters], { where, orderBy: orderBySort })
      : [];
    console.log(items, where);
    if (!showAll) items = items.filter((chara) => chara.visible);
    const parts = [] as { label?: string; items: CharacterType[] }[];
    let sortType: OrderByType | undefined;
    let entries: [string, CharacterType[]][] | undefined;
    const timeSort = orderBySort?.find((v) => v.time)?.time;
    if (timeSort) {
      sortType = timeSort;
      const map = items.reduce<Map<string, CharacterType[]>>((a, c) => {
        const year =
          (c.time?.getFullYear() || c.birthday?.getFullYear())?.toString() ||
          "";
        if (a.has(year)) a.get(year)!.push(c);
        else a.set(year, [c]);
        return a;
      }, new Map());
      entries = Object.entries(Object.fromEntries(map));
    }
    const nameSort = orderBySort?.find((v) => v.name)?.name;
    if (nameSort) {
      sortType = nameSort;
      const map = items.reduce<Map<string, CharacterType[]>>((a, c) => {
        const initial = getInitialString(c.nameGuide || c.name);
        if (a.has(initial)) a.get(initial)!.push(c);
        else a.set(initial, [c]);
        return a;
      }, new Map());
      entries = Object.entries(Object.fromEntries(map));
    }
    if (sortType && entries) {
      entries.sort(([a], [b]) => {
        if (a && b) {
          return (a > b ? 1 : -1) * (sortType === "asc" ? 1 : -1);
        } else {
          return a ? -1 : 1;
        }
      });
      entries.forEach(([key, item]) => {
        if (key) parts.push({ label: key.toString(), items: item });
        else parts.push({ items: item });
      });
    } else parts.push({ items });
    return parts;
  }, [where, characters, orderBySort, showAll]);
  const apiOrigin = useApiOrigin()[0];
  const [move, setMove] = useMoveCharacters();
  const setCharactersLoad = charactersDataObject.useLoad()[1];
  const Inner = useCallback(
    ({ item }: { item: CharacterType }) => (
      <Link
        to={move ? "" : `/character/${item.key}`}
        state={{
          ...(state ?? {}),
          characterSort: orderBySort,
          charaFilters: filters,
          backUrl: location.href,
        }}
        className="item"
        key={item.key}
      >
        <CharaListItem chara={item} />
      </Link>
    ),
    [move]
  );
  return (
    <>
      <CharaSearchArea />
      {parts
        .filter(({ items }) => items.length > 0)
        .map(({ label, items }, i) => {
          return (
            <div key={i}>
              {label ? <h2 className="color-main">{label}</h2> : null}
              <ul className="charaList">
                {move ? (
                  <Movable
                    items={items}
                    Inner={Inner}
                    submit={move === 2}
                    onSubmit={(items) => {
                      const dirty = items
                        .map((item, i) => ({
                          ...item,
                          newOrder: i + 1,
                        }))
                        .filter((item) => {
                          return item.newOrder !== item.order;
                        })
                        .map(({ key, newOrder }) => {
                          return { target: key, order: newOrder };
                        });
                      if (dirty.length > 0) {
                        toast.promise(
                          axios
                            .post(
                              concatOriginUrl(apiOrigin, "character/send"),
                              dirty,
                              {
                                withCredentials: true,
                              }
                            )
                            .then(() => {
                              setCharactersLoad("no-cache");
                              setMove(0);
                            }),
                          {
                            pending: "送信中",
                            success: "送信しました",
                            error: "送信に失敗しました",
                          }
                        );
                      } else {
                        setMove(0);
                      }
                    }}
                  />
                ) : (
                  <>
                    {items.map((chara, i) => (
                      <li key={i}>
                        <Inner item={chara} />
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          );
        })}
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
      list = findMee(list, {
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
  { name: "main" },
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
    if (chara?.media?.playlist && chara.media.playlist.list.length > 0) {
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
                <span translate={chara.enName ? "no" : "yes"}>
                  {chara.name + (chara.honorific ?? "")}
                </span>
              </h1>
              {chara.enName ? (
                <p className="color-main">EN Name: {chara.enName}</p>
              ) : null}
              <div className="overview">{chara.overview}</div>
            </div>
            {chara.media?.headerImage ? (
              <p>
                <ImageMee
                  imageItem={chara.media.headerImage}
                  className="headerImage"
                  loading="eager"
                  suppressHydrationWarning={true}
                />
              </p>
            ) : null}
            {chara.media?.image ? (
              <p>
                <ImageMee
                  imageItem={chara.media.image}
                  className="mainImage"
                  mode="thumbnail"
                  loading="eager"
                  suppressHydrationWarning={true}
                  style={{ objectFit: "cover" }}
                  height={340}
                />
              </p>
            ) : null}
            {chara.time ? (
              <p>
                <span>デビュー年：</span>
                <span>{chara.time.getFullYear()}年</span>
              </p>
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
  const isModal = searchParams.has("modal");
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
      replace: isModal || location.href !== confirmUrl,
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
