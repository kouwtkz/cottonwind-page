import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  ImageMee,
  ImageMeeIcon,
  ImageMeeQuestion,
  ImageMeeThumbnail,
} from "~/components/layout/ImageMee";
import {
  useCharacters,
  useSelectedCharacter,
} from "~/components/state/CharacterState";
import { GalleryObject } from "./GalleryPage";
import {
  type HTMLAttributes,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useImageState } from "~/components/state/ImageState";
import { MultiParserWithMedia } from "~/components/parse/MultiParserWithMedia";
import { CharacterEdit, CharaEditButton } from "./edit/CharacterEdit";
import { useSoundPlayer } from "~/components/layout/SoundPlayer";
import { useHotkeys } from "react-hotkeys-hook";
import { findMee, setWhere } from "~/data/find/findMee";
import { ContentsTagsSelect } from "~/components/dropdown/SortFilterReactSelect";
import { defineSortTags } from "~/components/dropdown/SortFilterTags";
import { useIsLogin } from "~/components/state/EnvState";
import { CreateObjectState, CreateState } from "~/components/state/CreateState";
import { Movable } from "~/components/layout/edit/Movable";
import { toast } from "react-toastify";
import { concatOriginUrl } from "~/components/functions/originUrl";
import { apiOrigin, charactersDataIndexed } from "~/data/ClientDBLoader";
import { getInitialString } from "~/components/functions/InitialString";
import { TbColumns2, TbColumns3 } from "react-icons/tb";
import { LikeButton } from "~/components/button/LikeButton";
import { useLang } from "~/components/multilingual/LangState";
import { DEFAULT_LANG } from "~/Env";
import { customFetch } from "~/components/functions/fetch";
import { getBackURL } from "~/components/layout/BackButton";
import { charactersDataOptions, GetAPIFromOptions } from "~/data/DataEnv";
import { Modal } from "~/components/layout/Modal";

interface PartsType {
  label?: string;
  items: CharacterType[];
}

interface CharacterStateType {
  filters?: string[];
  showAll?: boolean;
  liked?: boolean;
  where?: findWhereType<CharacterType>;
  tagsWhere?: findWhereType<CharacterType> | null;
  orderBySort?: OrderByItem<CharacterType>[];
  parts?: PartsType[];
}
export const useCharacterPageState = CreateObjectState<CharacterStateType>({});
function CharacterPageState() {
  const { search } = useLocation();
  const confirmUrl = useConfirmUrl()[0];
  const searchParams = useMemo(() => {
    if (confirmUrl) return new URL(confirmUrl).searchParams;
    else return new URLSearchParams(search);
  }, [confirmUrl, search]);

  const isLogin = useIsLogin()[0];
  const filters = useMemo(
    () => searchParams.get("filter")?.split(","),
    [searchParams]
  );
  const showAll = useMemo(
    () => filters?.some((v) => v === "showAll"),
    [filters, isLogin]
  );
  const clientShowAll = useMemo(() => isLogin || showAll, [showAll, isLogin]);
  const liked = useMemo(() => filters?.some((v) => v === "like"), [filters]);
  const searchParamsTags = useMemo(
    () =>
      searchParams.has("tags") ? searchParams.get("tags")!.split(",") : null,
    [searchParams]
  );
  const text = useMemo(() => {
    const textArray: Array<string> = [];
    if (searchParams.has("q")) textArray.push(searchParams.get("q")!);
    if (searchParamsTags)
      searchParamsTags.forEach((tag) => {
        textArray.push("tags:" + tag);
      });
    return textArray.join(" ");
  }, [searchParams, searchParamsTags]);
  const whereOptions = useMemo(
    () =>
      setWhere<CharacterType>(text, {
        text: {
          key: [
            "key",
            "name",
            "enName",
            "overview",
            "description",
            "honorific",
            "nameGuide",
          ],
        },
        hashtag: { key: "tags" },
        kanaReplace: ["name"],
      }),
    [text]
  );
  const { orderBy } = whereOptions;
  const filterDraft = useMemo(
    () => filters?.some((v) => v === "draft"),
    [filters]
  );
  const where: findWhereType<CharacterType> = useMemo(() => {
    const wheres = [whereOptions.where];
    if (!showAll && !searchParamsTags?.some((v) => v === "archive"))
      wheres.push({ NOT: { tags: { contains: "archive" } } });
    if (filterDraft) wheres.push({ draft: true });
    if (liked) wheres.push({ like: { checked: true } });
    return { AND: wheres };
  }, [whereOptions.where, searchParamsTags, filterDraft, liked, showAll]);
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
      case "likeCount":
        list.push({ like: { count: "desc" } });
        break;
    }
    return list;
  }, [sortParam, orderBy]);
  const { characters } = useCharacters();
  const [parts, setParts] = useState<PartsType[]>();
  useEffect(() => {
    let items = findMee(characters?.concat(), { where, orderBy: orderBySort });
    if (!clientShowAll) items = items.filter((chara) => chara.visible);
    const parts: PartsType[] = [];
    let sortType: OrderByItemType<any> | undefined;
    let entries: [string, CharacterType[]][] | undefined;
    const timeSort = orderBySort?.find((v) => v.time)?.time as OrderByUdType;
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
    const nameSort = orderBySort?.find((v) => v.name)?.name as OrderByUdType;
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
    setParts(parts);
  }, [characters, orderBySort, clientShowAll, liked, where]);
  const { Set } = useCharacterPageState();
  useEffect(() => {
    Set({ filters, orderBySort, showAll: clientShowAll, liked, where, parts });
  }, [filters, orderBySort, clientShowAll, liked, where, parts]);
  return <></>;
}

export function CharacterPage({
  charaName,
  forceListMode,
}: {
  charaName?: string;
  forceListMode?: boolean;
}) {
  const searchParams = useSearchParams()[0];
  const isEdit = useMemo(
    () => searchParams.get("edit") === "on",
    [searchParams]
  );
  const isLogin = useIsLogin()[0];
  return (
    <div className="characterPage">
      <CharacterPageState />
      {forceListMode ? (
        <CharaListPage />
      ) : isLogin && isEdit ? (
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

export function translateCharaLangName(
  chara: CharacterType,
  lang = DEFAULT_LANG
) {
  const toEn = lang !== DEFAULT_LANG && chara.enName;
  const returnValue = {
    name: toEn ? chara.enName : chara.name,
  } as { name?: string; lang?: string };
  if (toEn) returnValue.lang = "en";
  return returnValue;
}
interface CharacterName extends HTMLAttributes<HTMLSpanElement> {
  chara: CharacterType;
}
export function CharacterName({ chara, ...props }: CharacterName) {
  const lang = useLang()[0];
  const translated = translateCharaLangName(chara, lang);
  return (
    <span lang={translated.lang} {...props}>
      {translated.name}
    </span>
  );
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
        {chara.image ? (
          <ImageMeeThumbnail
            imageItem={chara.image}
            className="image"
            loadingScreen={true}
          />
        ) : chara.icon ? (
          <ImageMeeThumbnail
            imageItem={chara.icon}
            className="image"
            loadingScreen={true}
          />
        ) : (
          <ImageMeeQuestion alt={chara.name} />
        )}
      </div>
      <div className="name">
        <CharacterName chara={chara} />
      </div>
    </>
  );
});

const SEND_API = GetAPIFromOptions(charactersDataOptions, "/send");

const useExtendMode = CreateState(false);
export const useMoveCharacters = CreateState(0);
function CharaListPage() {
  const { parts } = useCharacterPageState();
  const { state } = useLocation();
  const extendMode = useExtendMode()[0];
  const [move, setMove] = useMoveCharacters();
  const searchParams = useSearchParams()[0];
  const setSelectedCharacter = useSelectedCharacter()[1];
  const isModal = useMemo(
    () => searchParams.get("modal") === "character",
    [searchParams]
  );
  const Inner = useCallback(
    ({ item }: { item: CharacterType }) => {
      return (
        <Link
          to={move ? "" : `/character/${item.key}`}
          state={{
            ...(state ?? {}),
            backUrl: getBackURL(),
          }}
          onClick={(e) => {
            if (isModal) {
              e.preventDefault();
              setSelectedCharacter(item);
            }
          }}
          className="item"
          key={item.key}
        >
          <CharaListItem chara={item} />
        </Link>
      );
    },
    [move]
  );
  const charaListClassName = useMemo(() => {
    const classList = ["charaList", "wide"];
    if (extendMode) classList.push("extend");
    return classList.join(" ");
  }, [extendMode]);
  return (
    <>
      <CharaSearchArea />
      {parts
        ?.filter(({ items }) => items.length > 0)
        .map(({ label, items }, i) => {
          return (
            <div key={i}>
              {label ? <h2 className="color-main">{label}</h2> : null}
              <ul className={charaListClassName}>
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
                          customFetch(concatOriginUrl(apiOrigin, SEND_API), {
                            data: dirty,
                            method: "POST",
                            cors: true,
                          }).then(() => {
                            charactersDataIndexed.load("no-cache");
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

interface CharaBeforeAfterProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  charaName?: string;
  onClick?: (event?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}
export function CharaBeforeAfter({
  charaName,
  className,
  onClick,
  ...props
}: CharaBeforeAfterProps) {
  const OnClick = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
    (e) => {
      if (onClick) onClick(e);
    },
    [onClick]
  );
  const { charactersMap } = useCharacters();
  const chara = useMemo(
    () => charactersMap?.get(charaName || ""),
    [charactersMap, charaName]
  );
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "on";
  const { parts } = useCharacterPageState();
  const nav = useNavigate();
  const items = useMemo(() => {
    return (parts || []).reduce<CharacterType[]>((a, c) => {
      c.items.forEach((item) => {
        a.push(item);
      });
      return a;
    }, []);
  }, [parts]);
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
  const beforeTo = useMemo(
    () =>
      beforeChara
        ? "/character/" + beforeChara.key + (isEdit ? "?edit=on" : "")
        : "",
    [beforeChara, isEdit]
  );
  const afterTo = useMemo(
    () =>
      afterChara
        ? "/character/" + afterChara.key + (isEdit ? "?edit=on" : "")
        : "",
    [afterChara, isEdit]
  );
  const isModalMode = useMemo(
    () =>
      searchParams.has("modal") ||
      searchParams.has("image") ||
      searchParams.has("fc-event-id"),
    [searchParams]
  );
  useHotkeys(
    "ArrowLeft",
    (e) => {
      if (beforeTo && !isModalMode && !(e.ctrlKey || e.altKey)) {
        if (onClick) onClick();
        nav(beforeTo, { state });
      }
    },
    { ignoreModifiers: true, enableOnFormTags: false }
  );
  useHotkeys(
    "ArrowRight",
    (e) => {
      if (afterTo && !isModalMode && !(e.ctrlKey || e.altKey)) {
        if (onClick) onClick();
        nav(afterTo, { state });
      }
    },
    { ignoreModifiers: true, enableOnFormTags: false }
  );
  return (
    <div className={"beforeAfter" + (className ? " " + className : "")}>
      <div className="before" {...props}>
        {beforeChara ? (
          <Link to={beforeTo} state={state} onClick={OnClick}>
            <span className="cursor">＜</span>
            {beforeChara.icon ? (
              <ImageMeeIcon
                imageItem={beforeChara.icon}
                size={40}
                className="charaIcon"
              />
            ) : null}
            <CharacterName chara={beforeChara} />
          </Link>
        ) : null}
      </div>
      <div className="after" {...props}>
        {afterChara ? (
          <Link to={afterTo} state={state} onClick={OnClick}>
            {afterChara.icon ? (
              <ImageMeeIcon
                imageItem={afterChara.icon}
                size={40}
                className="charaIcon"
              />
            ) : null}
            <CharacterName chara={afterChara} />
            <span className="cursor">＞</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

const defaultGalleryList = [
  { name: "main" },
  { name: "works" },
  { name: "goods" },
  { name: "3D" },
  { name: "picture" },
  { name: "parody", max: 12 },
  { name: "given", label: "Fanart", max: 40 },
] as GalleryItemType[];
export function CharaDetail({ charaName }: { charaName: string }) {
  const { charactersMap, charactersTags } = useCharacters();
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
    if (chara?.soundPlaylist && chara.soundPlaylist.list.length > 0) {
      RegistPlaylist({ playlist: chara.soundPlaylist });
    }
  }, [chara?.soundPlaylist?.title]);
  const headClassName = useMemo(() => {
    const classNames: Array<string> = ["head"];
    if (chara?.headerImage) classNames.push("includeHeaderImage");
    return classNames.join(" ");
  }, [chara]);
  return (
    <>
      {charactersMap ? (
        chara ? (
          <div className="charaDetail">
            <CharaBeforeAfter charaName={charaName} />
            {chara.draft ? (
              <div className="color-gray">（下書き中のキャラクター）</div>
            ) : null}
            <div className={headClassName}>
              {chara.headerImage ? (
                <ImageMee
                  imageItem={chara.headerImage}
                  className="headerImage"
                  loading="eager"
                  suppressHydrationWarning={true}
                />
              ) : null}
              <h1 className="title">
                {chara.icon ? (
                  <ImageMeeIcon
                    imageItem={chara.icon}
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
            {chara.image ? (
              <p>
                <ImageMee
                  imageItem={chara.image}
                  className="mainImage"
                  mode="thumbnail"
                  loading="eager"
                  suppressHydrationWarning={true}
                  style={{ objectFit: "cover" }}
                  height={340}
                />
              </p>
            ) : null}
            {chara.tags && chara.tags.length > 0 ? (
              <p className="tags">
                {chara.tags
                  .map<ContentsTagsOption>((tag) => {
                    const found = charactersTags?.find(
                      (cTag) => cTag.value === tag
                    );
                    if (found) return found;
                    else return { value: tag };
                  })
                  .map((tag, i) => (
                    <Link key={i} to={`/character?tags=${tag.value}`}>
                      #{tag.label || tag.value}
                    </Link>
                  ))}
              </p>
            ) : null}
            {chara.time ? (
              <p>
                <span>デビュー年：</span>
                <span>{chara.time.getFullYear()}年</span>
              </p>
            ) : null}
            <MultiParserWithMedia>{chara.description}</MultiParserWithMedia>
            <LikeButton
              className="font-larger"
              url={"/character/" + chara.key}
            />
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
        ) : null
      ) : null}
    </>
  );
}

const useConfirmUrl = CreateState<string>();

interface CharaSearchAreaProps {}
const characterSortTags = [
  defineSortTags([
    "nameOrder",
    "leastNameOrder",
    "recently",
    "leastResently",
    "likeCount",
  ]),
];
export function CharaSearchArea({}: CharaSearchAreaProps) {
  const { charactersTags } = useCharacters();
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isModal = searchParams.has("modal");
  const { state } = useLocation();
  const isLogin = useIsLogin()[0];
  const [confirmUrl, setConfirmUrl] = useConfirmUrl();
  const [extendMode, setExtendMode] = useExtendMode();
  useEffect(() => {
    setConfirmUrl(location.href);
    const q = searchParams.get("q") || "";
    const search = searchRef.current;
    if (search && search.value !== q) {
      search.value = q;
    }
  }, [searchParams]);
  const q = useMemo(() => {
    const q = searchParams.get("q");
    if (q) return q;
  }, [searchParams]);
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
    const tags = characterSortTags.concat();
    const charaFilterOptions: ContentsTagsOption = {
      label: "フィルタ",
      name: "filter",
      options: [
        { label: "♥️いいね済み", value: "filter:like" },
        { label: "🔬全て表示", name: "showAll", value: "filter:showAll" },
      ],
    };
    if (isLogin) {
      charaFilterOptions.options!.push({
        value: "filter:draft",
        label: "📝下書き",
      });
    }
    tags.push(charaFilterOptions);
    if (charactersTags) {
      const charaTagsOptions: ContentsTagsOption = {
        label: "タグ",
        name: "tags",
        options: charactersTags,
      };
      tags.push(charaTagsOptions);
    }
    return tags;
  }, [charactersTags, isLogin]);

  return (
    <div className="header">
      <button
        type="button"
        title="切り替え"
        className="iconSwitch"
        onClick={() => {
          setExtendMode((v) => !v);
        }}
      >
        {extendMode ? <TbColumns3 /> : <TbColumns2 />}
      </button>
      <input
        name="q"
        type="search"
        className="search"
        placeholder="キャラクター検索"
        defaultValue={q}
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

export function MiniCharacterPage() {
  const [selectedCharacter, setSelectedCharacter] = useSelectedCharacter();
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const enable = useMemo(
    () => searchParams.get("modal") === "character",
    [searchParams]
  );
  const closeHandler = useCallback(() => {
    if (state?.from) {
      delete state.from;
      nav(-1);
    } else {
      searchParams.delete("modal");
      setSearchParams(searchParams, { state, preventScrollReset: true });
    }
  }, [state, searchParams]);
  useEffect(() => {
    if (selectedCharacter) {
      setSelectedCharacter(null);
      closeHandler();
    }
  }, [selectedCharacter, setSelectedCharacter]);
  return (
    <>
      <Modal
        classNameEntire="gallery"
        className="large"
        onClose={closeHandler}
        isOpen={enable}
        scroll
        timeout={50}
      >
        <CharacterPage forceListMode />
      </Modal>
    </>
  );
}
