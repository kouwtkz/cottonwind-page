import { RouteObject } from "react-router-dom";
import Root from "./Root";
import ErrorPage from "./ErrorPage";
import Home from "./Home";
import { CharaPage } from "./CharaPage";
import { GalleryGroupPage, GalleryPage } from "./GalleryPage";
import { ComicsViewer } from "../state/ComicsViewer";
import { SoundPage } from "./SoundPage";
import InfoPage from "./InfoPage";

export const Routing: RouteObject[] = [
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "character",
        element: <CharaPage />,
      },
      {
        path: "character/:name",
        element: <CharaPage />,
      },
      {
        path: "gallery",
        element: <GalleryPage />,
      },
      {
        path: "gallery/ebook",
        element: <ComicsViewer />,
      },
      {
        path: "gallery/:group",
        element: <GalleryGroupPage />,
      },
      {
        path: "sound",
        element: <SoundPage />,
      },
      {
        path: "info",
        element: <InfoPage />,
      },
    ],
  },
];
