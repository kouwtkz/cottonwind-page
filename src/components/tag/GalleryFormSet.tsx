import React, { useCallback, useMemo } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { LinkMee, MakeRelativeURL, SearchSet } from "../doc/MakeURL";
import { useGalleryObject } from "../../routes/GalleryPage";
import {
  defaultFilterTags,
  defaultSortTags,
  defaultTags,
  getTagsOptions,
} from "./GalleryTags";
import ReactSelect from "react-select";
import { HTMLAttributes } from "react";
import { callReactSelectTheme } from "../theme/main";
import { getJSTYear } from "../../data/functions/TimeFunctions";
import { AiFillEdit, AiOutlineFileImage } from "react-icons/ai";

export function GalleryYearFilter() {
  const nav = useNavigate();
  const { fList } = useGalleryObject(({ fList }) => ({ fList }));
  const search = useLocation().search;
  const { query } = useMemo(() => SearchSet(search), [search]);
  const year = Number(query.year);
  const isOlder = query.sort === "leastRecently";
  const yearSelectRef = React.useRef<HTMLSelectElement>(null);

  const yearListBase = useMemo(
    () =>
      getYearObjects(
        fList.reduce((a, c) => {
          c.forEach(({ time }) => {
            if (time) a.push(time);
          });
          return a;
        }, [] as Date[])
      ),
    [fList]
  );

  const yearListBase2 = useMemo(() => {
    const addedList =
      isNaN(year) || !yearListBase.every((y) => y.year !== year)
        ? yearListBase
        : yearListBase.concat({ year, count: 0 });
    addedList.forEach((y) => {
      y.label = `${y.year} (${y.count})`;
      y.value = String(y.year);
    });
    return addedList;
  }, [yearListBase, year]);

  const yearList = useMemo(() => {
    const sortedList = isOlder
      ? yearListBase2.sort((a, b) => a.year - b.year)
      : yearListBase2.sort((a, b) => b.year - a.year);
    const count = sortedList.reduce((a, c) => a + c.count, 0);
    sortedList.unshift({
      year: 0,
      count,
      label: `all (${count})`,
      value: "",
    });
    return sortedList;
  }, [yearListBase2, isOlder]);

  return (
    <select
      title="年フィルタ"
      className="yearFilter"
      ref={yearSelectRef}
      value={year || ""}
      onChange={() => {
        if (yearSelectRef.current) {
          const yearSelect = yearSelectRef.current;
          const params = { ...query };
          if (yearSelect.value) params.year = yearSelect.value;
          else delete params.year;
          nav(MakeRelativeURL({ query: params }), {
            preventScrollReset: true,
          });
        }
      }}
    >
      {yearList.map(({ value, label }, i) => (
        <option key={i} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

interface SearchAreaProps extends React.HTMLAttributes<HTMLFormElement> {}

export function GallerySearchArea({ className, ...args }: SearchAreaProps) {
  className = className ? ` ${className}` : "";
  const nav = useNavigate();
  const searchRef = React.useRef<HTMLInputElement>(null);
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
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const qRef = React.useRef(q);
  React.useEffect(() => {
    if (qRef.current !== q) {
      if (searchRef.current) {
        const strq = String(q);
        if (searchRef.current.value !== strq) searchRef.current.value = strq;
      }
      if (qRef.current !== q) qRef.current = q;
    }
  });

  return (
    <form
      className={className}
      {...args}
      onSubmit={(e) => {
        if (searchRef.current) {
          const q = searchRef.current.value;
          const query = Object.fromEntries(searchParams);
          if (q) query.q = q;
          else delete query.q;
          delete query.p;
          delete query.postId;
          nav(MakeRelativeURL({ query }), { preventScrollReset: false });
          (document.activeElement as HTMLElement).blur();
          e.preventDefault();
        }
      }}
    >
      <input
        name="q"
        type="search"
        placeholder="ギャラリー検索"
        defaultValue={q}
        ref={searchRef}
        className="search"
      />
    </form>
  );
}

function getYearObjects(dates: (Date | null | undefined)[]) {
  return dates
    .map((date) => getJSTYear(date))
    .reduce((a, c) => {
      const g = a.find(({ year }) => c === year);
      if (g) g.count++;
      else if (c) a.push({ year: c, count: 1 });
      return a;
    }, [] as YearListType[])
    .sort((a, b) => b.year - a.year);
}

interface SelectAreaProps extends HTMLAttributes<HTMLDivElement> {}

export function GalleryTagsSelect({ className }: SelectAreaProps) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTags = searchParams.get("tag")?.split(",") || [];
  const searchType =
    searchParams
      .get("type")
      ?.split(",")
      .map((v) => `type:${v}`) || [];
  const searchMonth =
    searchParams
      .get("month")
      ?.split(",")
      .map((v) => `month:${v}`) || [];
  const searchFilters =
    searchParams
      .get("filter")
      ?.split(",")
      .map((v) => `filter:${v}`) || [];
  const searchSort =
    searchParams
      .get("sort")
      ?.split(",")
      .map((v) => `sort:${v}`) || [];
  const searchQuery = searchTags.concat(
    searchType,
    searchMonth,
    searchFilters,
    searchSort
  );
  const tags = defaultSortTags.concat(
    import.meta.env.DEV ? defaultFilterTags : [],
    defaultTags
  );
  const currentTags = getTagsOptions(tags).filter((tag) =>
    searchQuery.some((stag) => tag.value === stag)
  );
  return (
    <div className={className}>
      <ReactSelect
        options={tags}
        value={currentTags}
        isMulti
        isSearchable={false}
        classNamePrefix="select"
        placeholder="ソート / フィルタ"
        instanceId="galleryTagSelect"
        className="tagSelect"
        theme={callReactSelectTheme}
        styles={{
          menuList: (style) => ({ ...style, minHeight: "22rem" }),
          menu: (style) => ({ ...style, zIndex: 9999 }),
        }}
        onChange={(list) => {
          const listObj: { [k: string]: string[] } = {
            sort: [],
            type: [],
            filter: [],
            tag: [],
            month: [],
          };
          list.forEach(({ value, group }) => {
            const values = (value?.split(":", 2) || [""]).concat("");
            switch (values[0]) {
              case "sort":
                listObj.sort = [values[1]];
                break;
              case "type":
                listObj.type = [values[1]];
                break;
              case "filter":
                listObj.filter.push(values[1]);
                break;
              case "month":
                listObj.month = [values[1]];
                break;
              default:
                if (value) listObj.tag.push(value);
                break;
            }
          });
          const query = Object.fromEntries(searchParams);
          Object.entries(listObj).forEach(([key, list]) => {
            if (list.length > 0) query[key] = list.join(",");
            else delete query[key];
          });
          nav(MakeRelativeURL({ query }), { preventScrollReset: true });
        }}
      />
    </div>
  );
}

export function GalleryPageEditSwitch() {
  const { state } = useLocation();
  const isEdit = useMemo(() => state?.edit === "on", [state?.edit]);
  return (
    <LinkMee
      title={isEdit ? "元に戻す" : "常に編集モードにする"}
      state={({ state }) => {
        if (!state) state = {};
        const isEdit = state.edit === "on";
        if (isEdit) delete state.edit;
        else state.edit = "on";
        return state;
      }}
      style={{ opacity: isEdit ? 1 : 0.4 }}
      replace={true}
      preventScrollReset={true}
    >
      <AiFillEdit />
    </LinkMee>
  );
}

export function GalleryPageOriginImageSwitch() {
  const { state } = useLocation();
  const isOrigin = useMemo(
    () => state?.showOrigin === "on",
    [state?.showOrigin]
  );
  return (
    <LinkMee
      title={isOrigin ? "元に戻す" : "画像を元のファイルで表示する"}
      state={({ state }) => {
        if (!state) state = {};
        const isOrigin = state.showOrigin === "on";
        if (isOrigin) delete state.showOrigin;
        else state.showOrigin = "on";
        return state;
      }}
      style={{ opacity: isOrigin ? 1 : 0.4 }}
      replace={true}
      preventScrollReset={true}
    >
      <AiOutlineFileImage />
    </LinkMee>
  );
}
