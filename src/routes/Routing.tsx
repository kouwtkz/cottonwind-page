import { NonIndexRouteObject, RouteObject } from "react-router-dom";
import Root from "./Root";
import ErrorPage from "./ErrorPage";
import Home from "./Home";
import { CharacterPage } from "./CharacterPage";
import { GalleryGroupPage, GalleryPage } from "./GalleryPage";
import { ComicsViewer } from "@/state/ComicsViewer";
import { SoundPage } from "./SoundPage";
import AboutPage from "./AboutPage";
import { RoutingUnion } from "./RoutingList";
import LinksPage from "./LinksPage";
import WorksPage from "./WorksPage";
import { BlogPage } from "./BlogPage";
import { PostForm } from "./edit/PostForm";
import ContactPage from "./ContactPage";
import { SettingDetailPage, SettingPage } from "./Setting";

export interface MeeRouteObject extends NonIndexRouteObject {
  path: RoutingUnion;
}

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
        element: <CharacterPage />,
      },
      {
        path: "character/:charaName",
        element: <CharacterPage />,
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
        path: "about",
        element: <AboutPage />,
      },
      { path: "links", element: <LinksPage /> },
      { path: "works", element: <WorksPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "blog/post", element: <PostForm /> },
      { path: "setting", element: <SettingPage /> },
      { path: "setting/:key", element: <SettingDetailPage /> },
    ] as MeeRouteObject[],
  },
];
