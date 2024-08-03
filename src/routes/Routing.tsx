import { NonIndexRouteObject, RouteObject } from "react-router-dom";
import Root from "./Root";
import ErrorPage from "./ErrorPage";
import Home from "./Home";
import { CharaPage } from "./CharaPage";
import { GalleryGroupPage, GalleryPage } from "./GalleryPage";
import { ComicsViewer } from "@/state/ComicsViewer";
import { SoundPage } from "./SoundPage";
import AboutPage from "./AboutPage";
import { RoutingUnion } from "./RoutingList";
import LinksPage from "@/routes/LinksPage";
import WorksPage from "./WorksPage";
import { BlogPage } from "@/blog/client";
import PostForm from "@/blog/PostForm";
import ContactPage from "./ContactPage";

export interface MeeRouteObject extends NonIndexRouteObject {
  path: RoutingUnion;
  noindex: boolean;
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
        element: <CharaPage />,
      },
      {
        path: "character/:charaName",
        element: <CharaPage />,
      },
      {
        path: "gallery",
        element: <GalleryPage />,
        noindex: true,
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
      { path: "blog/post", element: <PostForm />, isindex: false },
    ] as MeeRouteObject[],
  },
];
