export interface ContentsTagsOption {
  name?: string;
  label: string;
  color?: string;
  value?: string;
  index?: number;
  group?: string;
  count?: number;
  editable?: boolean;
  query?: { [k: string]: string };
  options?: ContentsTagsOption[];
}

export type ContentsTagsOptionDispatch = React.Dispatch<
  React.SetStateAction<ContentsTagsOption[]>
>

export const defaultGalleryTags: ContentsTagsOption[] = [
  {
    label: "タイプ",
    name: "type",
    editable: false,
    options: [
      { value: "type:illust", label: "🎨イラスト" },
      { value: "type:ebook", label: "📖漫画・小説" },
      { value: "type:goods", label: "🛍️販売・グッズ" },
      { value: "type:movie", label: "🎬動画・アニメ" },
      { value: "type:picture", label: "📷写真・VRC" },
      { value: "type:3d", label: "🧶3Dモデル" },
    ],
  },
  {
    label: "マンスリー",
    name: "monthly",
    options: [
      { value: "monthMode:event", label: "🔎月イベント", editable: false },
      { value: "monthMode:tag", label: "🔎月タグ", editable: false },
      { value: "month:1", label: "🎍1月" },
      { value: "month:2", label: "👹2月" },
      { value: "month:3", label: "🎎3月" },
      { value: "month:4", label: "🌸4月" },
      { value: "month:5", label: "🎏5月" },
      { value: "month:6", label: "☔6月" },
      { value: "month:7", label: "🎋7月" },
      { value: "month:8", label: "🥒8月" },
      { value: "month:9", label: "🎑9月" },
      { value: "month:10", label: "🍇10月" },
      { value: "month:11", label: "🍲11月" },
      { value: "month:12", label: "🎅12月" },
    ],
  },
  {
    label: "シーズン",
    name: "season",
    options: [
      { value: "spring", label: "🌸春" },
      { value: "summer", label: "🌻夏" },
      { value: "autumn", label: "🍂秋" },
      { value: "winter", label: "⛄冬" },
      { value: "valentine", label: "🍫バレンタインデー" },
      { value: "easter", label: "🐰イースター" },
      { value: "halloween", label: "🎃ハロウィン" },
      { value: "christmas", label: "🎄クリスマス" },
      { value: "myBirthday", label: "🎂自分の誕生日" },
    ],
  },
  {
    label: "コミュニティ",
    name: "community",
    options: [
      { value: "project", label: "🎪企画・イベント" },
      { value: "synopsis", label: "📰設定資料" },
      { value: "yosonoko", label: "🐕よその子" },
      { value: "birthday", label: "🎂誕生日" },
    ],
  },
  {
    label: "すがた",
    name: "form",
    options: [
      { value: "darkForm", label: "😈やみのすがた" },
      { value: "foodForm", label: "🍲たべもののすがた" },
    ],
  },
  {
    label: "活動",
    name: "activity",
    options: [
      { value: "competition", label: "🚩コンペ" },
      { value: "prize", label: "👑入賞" },
      { value: "commission", label: "📒コミッション" },
    ],
  },
];

export function addExtentionGalleryTagsOptions(options: ContentsTagsOption[]) {
  options.push(...[{ value: "type:banner", label: "🖼バナー" }]);
  return options;
}

export function addExtentionTagsOptions(options = defaultGalleryTags) {
  const list = options.concat();
  return list.map((item) => {
    if (item.name === "type") {
      return { ...item, options: addExtentionGalleryTagsOptions(item.options!.concat()) };
    }
    return item;
  })
}

export type filterMonthType = {
  month: number;
  tags: string[];
};

export const filterGalleryMonthList: filterMonthType[] = [
  { month: 1, tags: ["january", "winter"] },
  { month: 2, tags: ["february", "winter", "valentine"] },
  { month: 3, tags: ["march", "spring", "easter"] },
  { month: 4, tags: ["april", "spring", "easter"] },
  { month: 5, tags: ["may", "spring"] },
  { month: 6, tags: ["june", "rainy"] },
  { month: 7, tags: ["july", "summer"] },
  { month: 8, tags: ["august", "summer"] },
  { month: 9, tags: ["september", "autumn"] },
  { month: 10, tags: ["october", "halloween", "autumn"] },
  { month: 11, tags: ["november", "autumn"] },
  { month: 12, tags: ["december", "winter", "christmas", "myBirthday"] },
];

export type defineSortTagsUnion =
  | "recently"
  | "leastResently"
  | "nameOrder"
  | "leastNameOrder";

export function defineSortTags(tags: defineSortTagsUnion[]) {
  const options: ContentsTagsOption[] = [];
  tags.forEach((tag) => {
    switch (tag) {
      case "recently":
        options.push({ value: "sort:recently", label: "🕒新しい順" });
        break;
      case "leastResently":
        options.push({ value: "sort:leastRecently", label: "🕘古い順" });
        break;
      case "nameOrder":
        options.push({ value: "sort:nameOrder", label: "⬇️名前（昇順）" });
        break;
      case "leastNameOrder":
        options.push({ value: "sort:leastNameOrder", label: "⬆️名前（降順）" });
        break;
    }
  });
  return {
    label: "ソート",
    options,
  } as ContentsTagsOption;
}

export function getTagsOptions(tags: ContentsTagsOption[]) {
  return tags.reduce(
    (a, { options, ...c }) =>
      a.concat(options?.map((d) => ({ ...c, ...d })) || c),
    [] as ContentsTagsOption[]
  );
}

export function autoFixGalleryTagsOptions(tagsOptions: ContentsTagsOption[]) {
  return tagsOptions
    .filter(({ editable }) => editable !== false)
    .map((item) => {
      const values = (item.value?.split(":", 2) || [""]).concat("");
      switch (values[0]) {
        case "month":
          const monthTag = filterGalleryMonthList.find(
            ({ month }) => String(month) === values[1]
          )?.tags[0];
          if (monthTag) {
            return { ...item, value: monthTag, query: { month: values[1] } };
          } else return item;
        default:
          return item;
      }
    });
}
