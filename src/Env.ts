export const ImageDataOptions: StorageDataStateClassProps<ImageDataType> = {
  key: "images",
  src: "/images",
  version: "3.1.1",
  preLoad: false,
  latestField: { time: "desc" },
}

export const charactersDataOptions: StorageDataStateClassProps<CharacterDataType> = {
  key: "characters",
  src: "/characters",
  version: "1.5.1",
  preLoad: false,
  latestField: { id: "desc" },
  jsonFromDataOptions: { time: null },
}

export const postsDataOptions: StorageDataStateClassProps<PostDataType> = {
  key: "posts",
  src: "/posts",
  version: "1.4.1",
  preLoad: false,
  latestField: { time: "desc" },
  jsonFromDataOptions: { key: "postId" },
}

export const soundsDataOptions: StorageDataStateClassProps<SoundDataType> = {
  key: "sounds",
  src: "/sounds",
  version: "1.3.2",
  preLoad: false,
  latestField: { time: "desc" },
  jsonFromDataOptions: { time: null },
}

export const soundAlbumsDataOptions: StorageDataStateClassProps<SoundAlbumDataType> = {
  key: "soundAlbums",
  src: "/soundAlbums",
  version: "1.3.2",
  preLoad: false,
}

export const filesDataOptions: StorageDataStateClassProps<FilesRecordDataType> = {
  key: "files",
  src: "/files",
  version: "1.3.1",
  preLoad: false,
}

const linksJsonFromDataOptions = { key: ["title", "url", "image"] } as JsonFromDataObjectOptions<keyof SiteLinkData>;

export const linksDataOptions: StorageDataStateClassProps<SiteLinkData> = {
  key: "links",
  src: "/links",
  version: "1.0.1",
  preLoad: false,
  jsonFromDataOptions: linksJsonFromDataOptions
}

export const linksFavDataOptions: StorageDataStateClassProps<SiteLinkData> = {
  key: "linksFav",
  src: "/links/fav",
  version: "1.0.3",
  preLoad: false,
  oldServerKeys: ["favorite_links"],
  jsonFromDataOptions: linksJsonFromDataOptions
}

export const likeDataOptions: StorageDataStateClassProps<LikeType> = {
  key: "likeData",
  src: "/like",
  version: "1.0.1",
  preLoad: false,
  idField: "path"
}

export const KeyValueDBDataOptions: StorageDataStateClassProps<KeyValueDBDataType> = {
  key: "KeyValueDB",
  src: "/kvdb",
  version: "1.1.1",
  preLoad: false,
  idField: "key"
}

export const TableVersionDataOptions: StorageDataStateClassProps<TableVersionEntryType> = {
  key: "tables",
  src: "/tables",
  version: "1.0.1",
  idField: "key",
  preLoad: false,
}

export const ArrayEnv: ArrayEnvType = {
  NAV: [
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
  ],
  LINKS: [
    {
      mask: "#mask_twitter",
      name: "𝕏 (Twitter)",
      url: "https://x.com/kouwtkz"
    },
    {
      mask: "#mask_youtube",
      name: "youtube",
      url: "https://www.youtube.com/@kouwtkz"
    },
    {
      mask: "#mask_pixiv",
      name: "pixiv",
      url: "https://www.pixiv.net/users/5577703"
    },
    {
      mask: "#mask_instagram",
      name: "instagram",
      url: "https://www.instagram.com/kouwtkz/"
    },
    {
      hidden: true,
      mask: "#mask_misskey_design",
      name: "MisskeyDesign",
      rel: "me",
      row: 2,
      title: "Misskey design",
      url: "https://misskey.design/@kouwtkz"
    },
    {
      mask: "#mask_mascodon",
      name: "Mascodon",
      rel: "me",
      row: 2,
      title: "マスコどん！",
      url: "https://mascodon.jp/@kouwtkz"
    },
    {
      mask: "#mask_bluesky",
      name: "Bluesky",
      rel: "me",
      row: 2,
      url: "https://bsky.app/profile/kouwtkz.cottonwind.com"
    },
    {
      hidden: true,
      name: "Note",
      url: "https://note.com/kouwtkz/"
    },
    {
      hidden: true,
      mask: "#mask_github",
      name: "GitHub",
      url: "https://github.com/kouwtkz"
    },
    {
      mask: "#mask_booth",
      name: "BOOTH",
      rel: "me",
      row: 2,
      url: "https://cottonwind.booth.pm/"
    }
  ],
  IMAGE_ALBUMS: [
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
  ]
}