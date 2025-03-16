import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Routing } from "@/routes/Routing";
import "@/components/hook/ScrollLock";
import { FluffClick } from "./layout/ClickEffect";
import { ClickEventState } from "./components/hook/useClickEvent";
import { LangState } from "./multilingual/LangState";
import { Theme } from "@/components/theme/Theme";

const router = createBrowserRouter(Routing);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <FluffClick />
    <ClickEventState />
    <LangState />
    <Theme />
    <RouterProvider router={router} />
  </>
);
