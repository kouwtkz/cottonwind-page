interface webManifestType {
  "name": string,
  "short_name"?: string,
  "start_url"?: string,
  "scope"?: string,
  "display"?: "fullscreen" | "standalone" | "minimal-ui" | "browser",
  "background_color"?: string,
  "theme_color"?: string,
  "description"?: string,
  "icons"?: iconType[],
  "related_applications"?: [
    {
      "platform"?: string,
      "url"?: string
    }
  ],
  "share_target": {
    "action": string,
    "method"?: "GET" | "POST",
    "enctype"?: "multipart/form-data",
    "params": {
      "title"?: string,
      "text"?: string,
      "url"?: string,
      "files"?: [
        {
          "name": "name" | string,
          "accept": string[]
        },
      ]
    }
  },
  "shortcuts"?: {
    "name": string,
    "url": string,
    "icons": iconType[]
  }[],
  "gcm_sender_id"?: string,
  "gcm_user_visible_only"?: boolean,
  "related_applications"?: {
    "platform": "play" | string,
    "url": string,
    "id"?: "com.example.app1"
  }[],
  "capture_links"?: "none" | "new-client" | "existing-client-navigate" | "existing-client-event",
}

type iconType = {
  "src": string,
  "sizes": string,
  "type": string,
  "purpose"?: "any monochrome"
}