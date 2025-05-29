import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Routing } from "@src/routes/Routing";
import "@src/components/hook/ScrollLock";
import { ClickEffect } from "@src/components/click/ClickEffect";
import { ClickEventState } from "@src/components/click/useClickEvent";
import { LangState } from "./multilingual/LangState";
import { Theme } from "@src/components/theme/Theme";
import { DOMContentLoaded } from "./clientScripts";
import { dbCreatePromise } from "./data/DataState";

const router = createBrowserRouter(Routing);

DOMContentLoaded(() => {
  dbCreatePromise.finally(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <>
        <ClickEffect />
        <ClickEventState />
        <LangState />
        <Theme />
        <RouterProvider router={router} />
      </>
    );
  });
});
