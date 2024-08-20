import { ContentsTagsOption, getTagsOptions } from "./SortFilterTags";
import { callReactSelectTheme } from "@/theme/main";
import { HTMLAttributes, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ReactSelect, { MultiValue } from "react-select";

interface SelectAreaProps
  extends HTMLAttributes<HTMLDivElement>,
    SearchAreaOptionsProps {
  tags: ContentsTagsOption[];
}

export function ContentsTagsSelect({
  tags,
  className,
  submitPreventScrollReset = true,
}: SelectAreaProps) {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const currentTags = getTagsOptions(tags).filter((tag) =>
    searchQuery.some((stag) => tag.value === stag)
  );
  const changeHandler = useCallback(
    (list: MultiValue<ContentsTagsOption>) => {
      const listObj: { [k: string]: string[] } = {
        sort: [],
        type: [],
        filter: [],
        tag: [],
        month: [],
      };
      list.forEach(({ value }) => {
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
      Object.entries(listObj).forEach(([key, list]) => {
        if (list.length > 0) searchParams.set(key, list.join(","));
        else searchParams.delete(key);
      });
      setSearchParams(searchParams, {
        preventScrollReset: submitPreventScrollReset,
      });
    },
    [searchParams]
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
        onChange={changeHandler}
      />
    </div>
  );
}
