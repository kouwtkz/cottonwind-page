import { Slide, ToastContainerProps } from "react-toastify";

export const defaultToastContainerOptions: ToastContainerProps = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: false,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "colored",
  transition: Slide
}
