import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./routes/Root";
import Home from "./routes/Home";
import { CharaPage } from "./routes/CharaPage";
import { GalleryGroupPage, GalleryPage } from "./routes/GalleryPage";
import ErrorPage from "./routes/ErrorPage";
import { SoundPage } from "./routes/SoundPage";
import { ComicsViewer } from "./state/ComicsViewer";

const router = createBrowserRouter([
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
