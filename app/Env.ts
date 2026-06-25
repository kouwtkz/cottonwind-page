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
if (import.meta.env.VITE_ATPROTO_GET_BLOG) {
  const blogIndex = NAV.findIndex(v => v.url === "/blog");
  if (blogIndex >= 0) NAV.splice(blogIndex, 1)
}

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
    description: "オリジナルキャラクターのイラストです！",
    name: "main",
    title: "Main art",
    type: "illust",
    latest: true,
    gallery: {
      pages: {},
      generate: {
        h2: "メインイラスト！",
        h4: "オリジナルキャラのイラストです！"
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
