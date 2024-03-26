import { SetRegisterReturn } from "../hook/SetRegister";
import MultiParser from "../../doc/MultiParser";
import { useEffect, useRef } from "react";
import { create } from "zustand";

type PreviewModeType = {
  previewMode: boolean;
  previewBody?: string;
};
type PreviewModeStateType = PreviewModeType & {
  setPreviewMode: (option: PreviewModeType) => void;
  togglePreviewMode: (body?: string) => void;
};

export const usePreviewMode = create<PreviewModeStateType>((set) => ({
  previewMode: false,
  previewBody: "",
  setPreviewMode: (option) => {
    set(option);
  },
  togglePreviewMode: (body = "") => {
    set((state) => {
      const newState = { previewMode: !state.previewMode } as PreviewModeType;
      if (newState) newState.previewBody = body;
      return newState;
    });
  },
}));

type PostTextareaProps = {
  registed?: SetRegisterReturn;
  disabled?: boolean;
  id?: string;
  title?: string;
  placeholder?: string;
  className?: string;
};
export function PostTextarea({
  registed,
  disabled,
  id,
  title,
  placeholder,
  className = "",
}: PostTextareaProps) {
  const { previewMode, previewBody, togglePreviewMode, setPreviewMode } =
    usePreviewMode();
  const firstCheckMode = useRef(true);

  useEffect(() => {
    if (firstCheckMode.current) {
      setPreviewMode({ previewMode: false, previewBody: "" });
      firstCheckMode.current = false;
    }
  });
  const bodyClass = (className ? `${className} ` : "") + "";
  return (
    <>
      <textarea
        {...registed}
        disabled={disabled}
        id={id}
        title={title}
        placeholder={placeholder}
        className={bodyClass + (previewMode ? "hidden" : "block")}
      />
      <div
        className={
          bodyClass + "preview-area " + (previewMode ? "block" : "hidden")
        }
      >
        <MultiParser className="blog">{previewBody}</MultiParser>
      </div>
    </>
  );
}
