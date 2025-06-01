import { Slide, type ToastContainerProps, type ToastOptions, type UpdateOptions } from "react-toastify";

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
  progressClassName: "color-main",
  closeButton: true,
};

export const toastLoadingShortOptions: ToastOptions = {
  ...toastLoadingOptions,
  autoClose: 1000,
};

export const toastUpdateOptions: UpdateOptions = {
  progress: 0,
  ...toastDefaultOptions,
  progressClassName: "color-white",
  isLoading: false,
  onClose: null,
}

export const defaultToastContainerOptions: ToastContainerProps = {
  ...toastDefaultOptions,
  newestOnTop: false,
  transition: Slide,
  theme: "colored",
}
