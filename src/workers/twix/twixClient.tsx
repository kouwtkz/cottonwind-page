import { defaultToastContainerOptions } from "@src/components/define/toastContainerDef";
import { CopyWithToast } from "@src/functions/toastFunction";
import { createRoot } from "react-dom/client";
import { toast, ToastContainer } from "react-toastify";
const container = document.getElementById("app")!;
const root = createRoot(container);

root.render(<App />);

function App() {
  const copyArea = document.getElementById("copyArea");
  if (copyArea) {
    const token = copyArea.dataset.token;
    if (token) {
      copyArea.addEventListener("click", () => {
        CopyWithToast(token);
      });
    }
  }
  return (
    <>
      <ToastContainer {...defaultToastContainerOptions} />
    </>
  );
}
