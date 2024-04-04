import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Routing } from "./routes/Routing";

const router = createBrowserRouter(Routing);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);

function scrollLockHandle(e: Event) {
  if (document.body.classList.contains("scrollLock")) {
    let pD = e.target! as HTMLElement | null;
    while (pD && pD.clientHeight === pD.scrollHeight) {
      pD = pD.parentElement;
    }
    if (!pD || pD.classList.contains("scrollLock")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
const pf = { passive: false };

document.addEventListener("wheel", scrollLockHandle, pf);
document.addEventListener("touchmove", scrollLockHandle, pf);
