import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Routing } from "@/routes/Routing";

const router = createBrowserRouter(Routing);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);

function scrollLockHandle(e: Event) {
  const html = document.querySelector("html");
  if (html?.classList.contains("scrollLock")) {
    let pD = e.target! as HTMLElement | null;
    while (
      pD &&
      (pD.classList.contains("scrollThrough") ||
        pD.clientHeight === pD.scrollHeight)
    ) {
      pD = pD.parentElement;
    }
    if (!pD || pD.parentElement?.classList.contains("scrollLock")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
const pf = { passive: false };

document.addEventListener("wheel", scrollLockHandle, pf);
document.addEventListener("touchmove", scrollLockHandle, pf);
