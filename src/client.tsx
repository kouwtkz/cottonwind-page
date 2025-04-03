import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Routing } from "@/routes/Routing";
import "@/components/hook/ScrollLock";
import { ClickEffect } from "@/components/click/ClickEffect";
import { ClickEventState } from "@/components/click/useClickEvent";
import { LangState } from "./multilingual/LangState";
import { Theme } from "@/components/theme/Theme";

const router = createBrowserRouter(Routing);

document.addEventListener("DOMContentLoaded", () => {
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
