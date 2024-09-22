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

export const defaultToastContainerOptions: ToastContainerProps = {
  ...toastDefaultOptions,
  newestOnTop: false,
  transition: Slide,
  theme: "colored",
}
