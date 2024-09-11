import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Routing } from "@/routes/Routing";
import "@/components/hook/ScrollLock";

const router = createBrowserRouter(Routing);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
