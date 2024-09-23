import { defaultToastContainerOptions } from "@/components/define/toastContainerDef";
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
        navigator.clipboard?.writeText(token);
        toast.success("コピーしました", { autoClose: 1500 });
      });
    }
  }
  return (
    <>
      <ToastContainer {...defaultToastContainerOptions} />
    </>
  );
}
