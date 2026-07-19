import { type HTMLAttributes, useCallback, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router";
import { getTagsOptions, TimeframeTagMap } from "./SortFilterTags";
import { callReactSelectTheme } from "~/components/define/callReactSelectTheme";
import type { MultiValue, SingleValue } from "react-select";
import { CustomReactSelect } from "./CustomReactSelect";

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
  const isModal = searchParams.has("modal");
  const searchTags = searchParams.get("tags")?.split(",") || [];
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
  const searchMonthMode =
    searchParams
      .get("monthMode")
      ?.split(",")
      .map((v) => `monthMode:${v}`) || [];
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
  const searchVisible =
    searchParams
      .get("visible")
      ?.split(",")
      .map((v) => `visible:${v}`) || [];
  const searchCopyright =
    searchParams
      .get("copyright")
      ?.split(",")
      .map((v) => `copyright:${v}`) || [];
  const searchViewMode =
    searchParams
      .get("viewMode")
      ?.split(",")
      .map((v) => `viewMode:${v}`) || [];
  const searchTotal =
    searchParams
      .get("total")
      ?.split(",")
      .map((v) => `total:${v || "general"}`) || [];
  const searchQuery = searchTags.concat(
    searchType,
    searchMonth,
    searchMonthMode,
    searchFilters,
    searchSort,
    searchVisible,
    searchCopyright,
    searchViewMode,
    searchTotal,
  );
  const [currentTags, suggestTags] = useMemo(() => {
    const labelMap: Map<string, string> = new Map();
    const currentTags = getTagsOptions(tags)
      .filter((tag) => searchQuery.some((stag) => tag.value === stag))
      .map((tag, i, array) => {
        if (i + 1 !== array.length) {
          const newLabel = tag.label?.replace(/\s\(\d+\)$/, "");
          if (tag.value && newLabel && tag.label !== newLabel) {
            labelMap.set(tag.value, newLabel);
          }
        }
        return tag;
      });
    function labelCheck(tag: ContentsTagsOption) {
      if (tag.value && labelMap.has(tag.value)) {
        tag.label = labelMap.get(tag.value)!;
      }
    }
    const suggestTags = tags.map((tag) => {
      labelCheck(tag);
      tag.options?.forEach((tag) => {
        labelCheck(tag);
      });
      return tag;
    });
    return [currentTags, suggestTags];
  }, [searchQuery, tags]);
  const changeHandler = useCallback(
    (
      _list: SingleValue<ContentsTagsOption> | MultiValue<ContentsTagsOption>,
    ) => {
      const listObj: { [k: string]: string[] } = {
        sort: [],
        visible: [],
        type: [],
        filter: [],
        tags: [],
        month: [],
        monthMode: [],
        copyright: [],
        viewMode: [],
        total: [],
      };
      const list = Array.isArray(_list) ? _list : [_list];
      list.forEach(({ value }) => {
        const values = (value?.split(":", 2) || [""]).concat("");
        switch (values[0]) {
          case "sort":
            listObj.sort = [values[1]];
            break;
          case "visible":
            listObj.visible.push(values[1]);
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
          case "monthMode":
            listObj.monthMode = [values[1]];
            break;
          case "copyright":
            listObj.copyright.push(values[1]);
            break;
          case "viewMode":
            listObj.viewMode.push(values[1]);
            break;
          case "total":
            listObj.total.push(values[1]);
            break;
          default:
            if (value) {
              if (TimeframeTagMap.has(value)) {
                listObj.tags = listObj.tags.filter(
                  (tag) => !TimeframeTagMap.has(tag),
                );
                listObj.tags.push(value);
              } else listObj.tags.push(value);
            }
            break;
        }
      });
      Object.entries(listObj).forEach(([key, list]) => {
        if (list.length > 0) searchParams.set(key, list.join(","));
        else searchParams.delete(key);
      });
      setSearchParams(searchParams, {
        preventScrollReset: submitPreventScrollReset,
        replace: isModal,
        state: { keep: true },
      });
    },
    [searchParams],
  );
  return (
    <CustomReactSelect
      options={suggestTags}
      value={currentTags}
      isMulti
      classNamePrefix="select"
      placeholder="ソート / フィルタ"
      instanceId="contentsTagSelect"
      className={"tagSelect" + (className ? " " + className : "")}
      theme={callReactSelectTheme}
      styles={{
        menuList: (style) => ({ ...style, minHeight: "22rem" }),
        menu: (style) => ({ ...style, zIndex: 9999 }),
      }}
      onChange={changeHandler}
    />
  );
}
