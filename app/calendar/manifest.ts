export const calendarManifest = {
  name: "めぇ式カレンダー",
  display: "standalone",
  scope: "/",
  start_url: "/",
  icons: [
    {
      src: "/static/images/png/faviconCalendar_150px.png",
      sizes: "150x150",
      type: "image/png",
    },
    {
      src: "/static/images/png/faviconCalendar_512px.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  share_target: {
    action: "/",
    params: {
      title: "name",
      text: "description",
      url: "link",
    },
  },
} as webManifestType
