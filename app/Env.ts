export const DEFAULT_LANG = import.meta.env.VITE_DEFAULT_LANG;
export const TITLE = import.meta.env.VITE_TITLE;
export const TITLE_EN = import.meta.env.VITE_TITLE_EN;
export const TITLE_IMAGE_PATH = "/static/images/webp/cottonwind_logo_min.webp"
export const TITLE_IMAGE_PATH_EN = "/static/images/webp/cottonwind_logo_min_en.webp"

const NAV: Array<SiteMenuItemType> = [
  {
    name: "home",
    url: "/"
  },
  {
    name: "gallery",
    url: "/gallery"
  },
  {
    name: "character",
    url: "/character"
  },
  {
    name: "sound",
    url: "/sound"
  },
  {
    name: "links",
    url: "/links"
  },
  {
    name: "works",
    url: "/works"
  },
  {
    name: "about",
    url: "/about"
  },
  {
    name: "blog",
    url: "/blog"
  },
  {
    name: "schedule",
    url: "/schedule"
  },
]

export const EnvLinks: { [k: string]: SiteMyLinksItemEnvType } = {
  bluesky: {
    mask: "#mask_bluesky",
    name: "Bluesky",
    rel: "me",
    row: 2,
    url: "https://bsky.app/profile/kouwtkz.cottonwind.com"
  },
  pixiv: {
    mask: "#mask_pixiv",
    name: "pixiv",
    url: "https://www.pixiv.net/users/5577703"
  },
  booth: {
    mask: "#mask_booth",
    name: "BOOTH",
    rel: "me",
    row: 2,
    url: "https://cottonwind.booth.pm/"
  },
  instagram:
  {
    mask: "#mask_instagram",
    name: "instagram",
    url: "https://www.instagram.com/kouwtkz/"
  },
  youtube: {
    mask: "#mask_youtube",
    name: "youtube",
    url: "https://www.youtube.com/@kouwtkz"
  },
  mascodon: {
    mask: "#mask_mascodon",
    name: "Mascodon",
    rel: "me",
    row: 2,
    title: "マスコどん！",
    url: "https://mascodon.jp/@kouwtkz"
  },
  "misskey.design": {
    name: "MisskeyDesign",
    mask: "#mask_misskey",
    rel: "me",
    row: 2,
    title: "Misskey design",
    url: "https://misskey.design/@kouwtkz"
  },
  x: {
    mask: "#mask_twitter",
    name: "𝕏 (Twitter)",
    url: "https://x.com/kouwtkz"
  },
  note: {
    name: "Note",
    url: "https://note.com/kouwtkz/"
  },
  github: {
    mask: "#mask_github",
    name: "このサイトプロジェクトのGitHub",
    url: "https://github.com/kouwtkz/cottonwind-page"
  }
};

const IMAGE_ALBUMS: Array<ImageAlbumEnvType> = [
  {
    name: "pickup",
    gallery: {
      pages: {
        linkLabel: false,
        max: 4
      }
    }
  },
  {
    description: "オリジナルキャラクターの作品です！",
    name: "main",
    title: "Main art",
    type: "illust",
    latest: true,
    gallery: {
      pages: {},
      generate: {
        h2: "メインイラスト！",
        h4: "オリジナルキャラの作品です！"
      }
    }
  },
  {
    description: "Blenderなどで作った3Dモデルです！",
    name: "3D",
    type: "3d",
    latest: true,
    gallery: {
      pages: {},
      generate: {
        h2: "作った3Dモデル！",
        h4: "これから増やしたい"
      }
    }
  },
  {
    description: "案件などのイラストです！",
    name: "works",
    type: "illust",
    latest: true,
    gallery: {
      pages: {},
      generate: {
        h2: "依頼で描いたイラスト！",
        h4: "お仕事依頼受け付けてます"
      }
    }
  },
  {
    description: "わたかぜっこのオリジナルグッズやスタンプなどです！",
    name: "goods",
    timeFormat: "Y.m.d",
    timeReplace: "released: $1",
    type: "goods",
    latest: true,
    gallery: {
      pages: {},
      generate: {
        h2: "作ったグッズなど！",
        h4: "今は販売してない場合があります"
      }
    }
  },
  {
    description: "ファンアートとして描いたイラストです！",
    name: "parody",
    type: "illust",
    latest: true,
    gallery: {
      pages: {
        max: 12
      },
      generate: {
        h2: "パロディアート",
        h4: "二次創作ファンアートやパロディを掲載してます！"
      }
    }
  },
  {
    description: "らくがき",
    name: "doodle",
    type: "illust",
    gallery: {
      pages: {
        hideWhenDefault: true,
        max: 4
      },
      generate: {
        h2: "らくがき",
      }
    }
  },
  {
    name: "picture",
    type: "picture",
    latest: true,
    visible: {
      title: true,
      filename: false,
      info: true
    },
    gallery: {
      pages: {
        max: 8
      },
      generate: {
        h2: "VRChatなどの写真"
      }
    }
  },
  {
    name: "uploads",
    latest: true,
    gallery: {
      pages: {
        label: "other",
        max: 4
      },
      generate: {
        h2: "その他アップロード",
        label: "other"
      }
    }
  },
  {
    name: "myBanner",
    type: "banner",
    gallery: {
      pages: {
        hide: true
      }
    }
  },
  {
    name: "linkBanner",
    type: "banner",
    gallery: {
      pages: {
        hide: true
      }
    }
  },
  {
    name: "blog",
    gallery: {
      pages: {
        hide: true
      }
    }
  },
  {
    description: "描いてくれたファンアートイラストです！",
    name: "given",
    title: "given fanart",
    gallery: {
      pages: {
        hideWhenDefault: true,
        max: 4
      },
      generate: {
        h2: "描いてくれてありがとめぇ！",
        h4: "#わたかぜメ絵",
        label: "given art"
      }
    }
  }
];

export const EnvLINKS = Object.entries(EnvLinks).reduce<SiteMyLinksItemType[]>((a, [key, value]) => {
  a.push({ key, ...value });
  return a;
}, []);
export const EnvLinksMap = new Map(EnvLINKS.map((v) => [v.key, v]) || []);

export const ArrayEnv: ArrayEnvType = {
  NAV,
  LINKS: EnvLINKS,
  IMAGE_ALBUMS
}

export const TimeframeTags: ContentsTagsOptionTimeframe[] = [
  { value: "morning", label: "🌄朝", during: "6:00-8:59", nameGuide: "あさ" },
  { value: "forenoon", label: "🚃午前", during: "9:00-11:59", nameGuide: "ごぜん" },
  { value: "midday", label: "🍱真昼", during: "12:00-13:59", nameGuide: "まひる" },
  { value: "afternoon", label: "🏞️午後", during: "14:00-16:59", nameGuide: "ごご" },
  { value: "evening", label: "🌇夕方", during: "17:00-19:59", nameGuide: "ゆうがた" },
  { value: "night", label: "🌃夜", during: "20:00-23:59", nameGuide: "よる" },
  { value: "midnight", label: "🌌夜中", during: "24:00-5:59", nameGuide: "よなか" },
];

export const defaultGalleryTags: ContentsTagsOption[] = [
  {
    label: "フィルタ",
    name: "filter",
    editable: false,
    options: [
      {
        label: "♥️いいね済み",
        name: "liked",
        value: "filter:like",
      },
    ],
  },
  {
    label: "タイプ",
    name: "type",
    editable: false,
    options: [
      { value: "type:illust", label: "🎨イラスト" },
      { value: "type:ebook", label: "📖漫画・小説", nameGuide: "まんが" },
      { value: "type:multi", label: "🗂️複数画像", nameGuide: "ふくすうがぞう" },
      { value: "type:goods", label: "🛍️販売・グッズ", nameGuide: "はんばい" },
      { value: "type:movie", label: "🎬動画・アニメ", nameGuide: "どうが" },
      { value: "type:picture", label: "📷写真・VRC", nameGuide: ["しゃしん", "ぶいあーる"] },
      { value: "type:3d", label: "🧶3Dモデル" },
      { value: "type:material", label: "📦素材", nameGuide: "そざい" },
      { value: "type:other", label: "🖼️その他の画像", nameGuide: "そのた" },
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
      { value: "spring", label: "🌸春", nameGuide: "はる" },
      { value: "summer", label: "🌻夏", nameGuide: "なつ" },
      { value: "autumn", label: "🍂秋", nameGuide: "あき" },
      { value: "winter", label: "⛄冬", nameGuide: "ふゆ" },
      { value: "valentine", label: "🍫バレンタインデー" },
      { value: "easter", label: "🐰イースター" },
      { value: "sea", label: "🌊海", nameGuide: "うみ" },
      { value: "summerFestival", label: "🎇夏祭り", nameGuide: "なつまつり" },
      { value: "halloween", label: "🎃ハロウィン" },
      { value: "christmas", label: "🎄クリスマス" },
      { value: "myBirthday", label: "🎂自分の誕生日", nameGuide: "たんじょうび" },
    ],
  },
  {
    label: "時間帯",
    name: "timeframe",
    options: TimeframeTags,
  },
  {
    label: "創作",
    name: "creation",
    options: [
      { value: "project", label: "🎪企画・イベント", nameGuide: "きかく" },
      { value: "synopsis", label: "📰設定資料", nameGuide: "せっていしりょう" },
      { value: "pixelArt", label: "👾ドット絵", nameGuide: ["どっとえ", "ぴくせるあーと"] },
    ],
  },
  {
    label: "コミュニティ",
    name: "community",
    options: [
      { value: "yosonoko", label: "🐕よその子", nameGuide: "よそのこ" },
      { value: "birthday", label: "🎂誕生日", nameGuide: "たんじょうび" },
      { value: "VRChat", label: "🥽VRChat", nameGuide: "ぶいあーるちゃっと" },
    ],
  },
  {
    label: "じょうたい",
    name: "status",
    options: [
      { value: "happy", label: "🎶ハッピーなすがた" },
      { value: "sleep", label: "💤ねてるすがた" },
      { value: "foodForm", label: "🍲たべもののすがた" },
      { value: "darkForm", label: "😈やみのすがた" }
    ],
  },
  {
    label: "活動",
    name: "activity",
    options: [
      { value: "competition", label: "🚩コンペ" },
      { value: "prize", label: "👑入賞", nameGuide: "にゅうしょう" },
      { value: "commission", label: "📒コミッション" },
      { value: "recommend", label: "👍おすすめ" },
    ],
  },
];

export const filterGalleryMonthList: filterGalleryMonthType[] = [
  { month: 1, tags: ["january", "winter"] },
  { month: 2, tags: ["february", "winter", "valentine"] },
  { month: 3, tags: ["march", "spring", "easter"] },
  { month: 4, tags: ["april", "spring", "easter"] },
  { month: 5, tags: ["may", "spring"] },
  { month: 6, tags: ["june", "rainy"] },
  { month: 7, tags: ["july", "summer", "七夕", "sea"] },
  { month: 8, tags: ["august", "summer", "summerFestival"] },
  { month: 9, tags: ["september", "autumn"] },
  { month: 10, tags: ["october", "halloween", "autumn"] },
  { month: 11, tags: ["november", "autumn"] },
  { month: 12, tags: ["december", "winter", "christmas", "myBirthday"] },
];

export function defineSortTags(tags: defineSortTagsUnion[]) {
  const options: ContentsTagsOption[] = [];
  tags.forEach((tag) => {
    switch (tag) {
      case "recently":
        options.push({ value: "sort:recently", label: "🕒新しい順", nameGuide: "あたらしい" });
        break;
      case "leastRecently":
        options.push({ value: "sort:leastRecently", label: "🕘古い順", nameGuide: "ふるい" });
        break;
      case "nameOrder":
        options.push({ value: "sort:nameOrder", label: "⬇️名前（昇順）", nameGuide: "なまえ" });
        break;
      case "leastNameOrder":
        options.push({ value: "sort:leastNameOrder", label: "⬆️名前（降順）", nameGuide: "なまえ" });
        break;
      case "creationTimeOrder":
        options.push({ value: "sort:creationTimeOrder", label: "⏳制作時間が長い順", nameGuide: "ながい" });
        break;
      case "shortnessCreationTimeOrder":
        options.push({ value: "sort:shortnessCreationTimeOrder", label: "⌛制作時間が短い順", nameGuide: "みじかい" });
        break;
      case "likeCount":
        options.push({ value: "sort:likeCount", label: "♥️いいね順" });
        break;
      case "mix":
        options.push({ value: "viewMode:mix", label: "🔄️全て合わせる" });
        break;
      case "total":
        options.push({ value: "total:general", label: "📊合計" });
        break;
    }
  });
  return {
    label: "ソート",
    name: "sort",
    options,
  } as ContentsTagsOption;
}
