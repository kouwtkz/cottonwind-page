import type { NonIndexRouteObject, RouteObject } from "react-router";
import Root from "./Root";
import ErrorPage from "./ErrorPage";
import Home from "./Home";
import { CharacterPage } from "./CharacterPage";
import { GalleryGroupPageRoot, GalleryPage } from "./GalleryPage";
import { SoundPage } from "./SoundPage";
import AboutPage from "./AboutPage";
import { type RoutingUnion } from "./RoutingList";
import LinksPage from "./LinksPage";
import WorksPage from "./WorksPage";
import { BlogPage } from "./BlogPage";
import { PostForm } from "./edit/PostForm";
import ContactPage from "./ContactPage";
import { SettingPage } from "./Setting";
import { AdminPage } from "./AdminPage";
import { ChangeLog } from "~/components/state/GitState";
import { SchedulePage } from "./SchedulePage";

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
        path: "gallery/:group",
        element: <GalleryGroupPageRoot />,
      },
      {
        path: "sound",
        element: <SoundPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "log",
        element: <ChangeLog />,
      },
      { path: "links", element: <LinksPage /> },
      { path: "works", element: <WorksPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "blog", element: <BlogPage /> },
      { path: "blog/post", element: <PostForm /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "setting", element: <SettingPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "admin/:key", element: <AdminPage /> },
    ] as MeeRouteObject[],
  },
];
