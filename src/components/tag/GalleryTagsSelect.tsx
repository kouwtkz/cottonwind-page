import { useLocation, useNavigate } from "react-router-dom";
import {
  defaultFilterTags,
  defaultSortTags,
  defaultTags,
  getTagsOptions,
} from "./GalleryTags";
import { MakeRelativeURL } from "../doc/MakeURL";
import ReactSelect from "react-select";
import { HTMLAttributes } from "react";
import { callReactSelectTheme } from "../theme/main";

interface SelectAreaProps extends HTMLAttributes<HTMLDivElement> {}

export default function GalleryTagsSelect({ className }: SelectAreaProps) {
  const nav = useNavigate();
  const search = new URLSearchParams(useLocation().search);
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
          nav(MakeRelativeURL({ query }), { preventScrollReset: false });
        }}
      />
    </div>
  );
}
