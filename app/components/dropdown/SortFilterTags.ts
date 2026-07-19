import { defaultGalleryTags, filterGalleryMonthList, TimeframeTags } from "~/Env";

export type ContentsTagsOptionDispatch = React.Dispatch<
  React.SetStateAction<ContentsTagsOption[]>
>;

export const TimeframeTagMap = new Map<string, ContentsTagsOptionTimeframe>(TimeframeTags.map(v => [v.value, v]));

export function addExtentionGalleryTagsOptions(options: ContentsTagsOption[]) {
  const index = options.findIndex(v => v.value === "type:other");
  const add: ContentsTagsOption = { value: "type:banner", label: "🎫バナー" };
  if (index >= 0) {
    options.splice(index, 0, add);
  } else options.push(...[add]);
  return options;
}

export function addExtentionTagsOptions(options = defaultGalleryTags) {
  const list = options.concat();
  return list.map((item) => {
    if (item.name === "type") {
      return {
        ...item,
        options: addExtentionGalleryTagsOptions(item.options!.concat()),
      };
    }
    return item;
  });
}

export const simpleDefaultTags = autoFixGalleryTagsOptions(getTagsOptions(defaultGalleryTags));

export function getTagsOptions(tags: ContentsTagsOption[]) {
  return tags.reduce(
    (a, { options, ...c }) =>
      a.concat(options?.map((d) => ({ ...c, ...d })) || c),
    [] as ContentsTagsOption[]
  );
}

export function MonthToTag(value: number) {
  return filterGalleryMonthList.find(({ month }) => month === value)?.tags[0];
}

export function autoFixGalleryTagsOptions(tagsOptions: ContentsTagsOption[]) {
  function convert(item: ContentsTagsOption) {
    const values = (item.value?.split(":", 2) || [""]).concat("");
    switch (values[0]) {
      case "month":
        const monthTag = MonthToTag(Number(values[1]));
        if (monthTag) {
          return { ...item, value: monthTag, query: { month: values[1] } };
        } else return item;
      default:
        return item;
    }
  }
  return tagsOptions
    .filter(({ editable }) => editable !== false)
    .map(({ ...item }) => {
      if (item.options) {
        item.options = item.options
          .filter((v) => v.editable !== false)
          .map(item => convert(item));
      }
      return convert(item);
    });
}

export const defaultGalleryEditableTags = autoFixGalleryTagsOptions(defaultGalleryTags);
