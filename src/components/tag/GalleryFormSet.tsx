import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { MakeRelativeURL } from "../doc/MakeURL";
import { useGalleryObject } from "../../routes/GalleryPage";
import { useParamsState } from "../../state/ParamsState";
import { YearListType } from "../../types/GalleryType";
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

export function GalleryYearFilter() {
  const nav = useNavigate();
  const { fList } = useGalleryObject(({ fList }) => ({ fList }));
  const { query } = useParamsState(({ query }) => ({ query }));
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
  const { search } = useParamsState();
  const q = search.get("q") || "";
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
          const query = Object.fromEntries(search);
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
        className="gallerySearch"
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
  const search = useParamsState((state) => state.search);
  const searchTags = search.get("tag")?.split(",") || [];
  const searchType =
    search
      .get("type")
      ?.split(",")
      .map((v) => `type:${v}`) || [];
  const searchMonth =
    search
      .get("month")
      ?.split(",")
      .map((v) => `month:${v}`) || [];
  const searchFilters =
    search
      .get("filter")
      ?.split(",")
      .map((v) => `filter:${v}`) || [];
  const searchSort =
    search
      .get("sort")
      ?.split(",")
      .map((v) => `sort:${v}`) || [];
  const searchQuery = searchTags.concat(
    searchType,
    searchMonth,
    searchFilters,
    searchSort
  );
  const isDev = import.meta.env.DEV;
  const tags = defaultSortTags.concat(
    isDev ? defaultFilterTags : [],
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
        className="galleryTagSelect"
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
          const query = Object.fromEntries(search);
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
