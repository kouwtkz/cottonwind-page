import { Slide, ToastContainerProps, ToastOptions, UpdateOptions } from "react-toastify";

export const toastDefaultOptions: ToastOptions = {
  autoClose: 3000,
  position: "top-center",
  hideProgressBar: false,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
}

export const toastLoadingOptions: ToastOptions = {
  progressStyle: { backgroundColor: "var(--main-color)" },
  closeButton: true,
};

export const toastUpdateOptions: UpdateOptions = {
  progress: 0,
  ...toastDefaultOptions,
  progressStyle: { backgroundColor: "white" },
  isLoading: false,
  onClose: null,
}

export const defaultToastContainerOptions: ToastContainerProps = {
  ...toastDefaultOptions,
  newestOnTop: false,
  transition: Slide,
  theme: "colored",
}
