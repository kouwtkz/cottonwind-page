import { createRoot } from "react-dom/client";
import toast, { Toaster } from "react-hot-toast";
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
        toast("コピーしました", {duration: 1500});
      });
    }
  }
  return (
    <>
      <Toaster />
    </>
  );
}
