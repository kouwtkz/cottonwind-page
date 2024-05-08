const SiteConfigList: SiteConfigListType = {
  "nav": [
    {
      "name": "home",
      "url": "/"
    },
    {
      "name": "gallery",
      "url": "/gallery"
    },
    {
      "name": "character",
      "short": "chara",
      "url": "/character"
    },
    {
      "name": "sound",
      "url": "/sound"
    },
    {
      "name": "about",
      "url": "/about"
    },
    {
      "name": "color",
      "switch": "theme"
    }
  ],
  "sns": [
    {
      "name": "𝕏 (Twitter)",
      "url": "https://x.com/kouwtkz",
      "mask": "/static/_media/mask/sns/twitter.webp"
    },
    {
      "name": "youtube",
      "url": "https://www.youtube.com/@kouwtkz",
      "mask": "/static/_media/mask/sns/youtube.webp"
    },
    {
      "name": "pixiv",
      "url": "https://www.pixiv.net/users/5577703",
      "mask": "/static/_media/mask/sns/pixiv.webp"
    },
    {
      "name": "instagram",
      "url": "https://www.instagram.com/kouwtkz/",
      "mask": "/static/_media/mask/sns/instagram.webp"
    },
    {
      "name": "github",
      "url": "https://github.com/kouwtkz",
      "mask": "/static/_media/mask/sns/github.webp",
      "none": true
    },
    {
      "name": "MisskeyDesign",
      "rel": "me",
      "title": "Misskey design",
      "url": "https://misskey.design/@kouwtkz",
      "mask": "/static/_media/mask/sns/misskey_design.webp",
      "hidden": true,
      "row": 2
    },
    {
      "name": "Mascodon",
      "rel": "me",
      "title": "マスコどん",
      "url": "https://mascodon.jp/@kouwtkz",
      "mask": "/static/_media/mask/sns/wtkz_mascodon.webp",
      "row": 2
    },
    {
      "name": "Bluesky",
      "rel": "me",
      "url": "https://bsky.app/profile/kouwtkz.cottonwind.com",
      "mask": "/static/_media/mask/sns/bluesky.webp",
      "row": 2
    },
    {
      "name": "kouwtkz",
      "title": "info",
      "mask": "/static/_media/mask/sns/other.webp",
      "url": "/info",
      "none": true,
      "row": 2
    },
    {
      "name": "VTdon",
      "rel": "me",
      "url": "https://vtdon.com/@kouwtkz",
      "mask": "/static/_media/mask/sns/vtdon.webp",
      "hidden": true,
      "row": 3
    }
  ],
  "gallery": {
    "list": [
      {
        "name": "pickup",
        "linkLabel": false,
        "max": 4
      },
      "art",
      "3D",
      "works",
      "goods",
      {
        "name": "parody",
        "max": 12
      },
      {
        "name": "picture",
        "max": 8
      },
      {
        "name": "uploads",
        "label": "other",
        "max": 4
      }
    ],
    "generate": [
      {
        "name": "art",
        "h2": "メインイラスト！",
        "h4": "オリジナルキャラのイラストです！"
      },
      {
        "name": "3D",
        "h2": "作った3Dモデル！",
        "h4": "これから増やしたい"
      },
      {
        "name": "works",
        "h2": "依頼で描いたイラスト！",
        "h4": "お仕事依頼受け付けてます"
      },
      {
        "name": "goods",
        "h2": "作ったグッズなど！",
        "h4": "今は販売してないものもあります"
      },
      {
        "name": "parody",
        "h2": "パロディアート",
        "h4": "二次創作ファンアートやパロディを掲載してます！"
      },
      {
        "name": "given",
        "label": "given art",
        "h2": "描いてくれてありがとめぇ！",
        "h4": "#わたかぜメ絵"
      },
      {
        "name": "picture",
        "h2": "VRChatなどの写真"
      },
      {
        "name": "uploads",
        "label": "other",
        "h2": "その他アップロード"
      }
    ]
  }
}

export default SiteConfigList;