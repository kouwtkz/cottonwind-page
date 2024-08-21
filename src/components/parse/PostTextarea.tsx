import React from "react";
import { SetRegisterReturn } from "../hook/SetRegister";
import { MultiParserWithMedia as MultiParser } from "./MultiParserWithMedia";
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
  const { previewMode, previewBody, setPreviewMode } = usePreviewMode();
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setPreviewMode({ previewMode: false, previewBody: "" });
  }, []);
  return (
    <>
      <textarea
        {...registed}
        disabled={disabled}
        id={id}
        title={title}
        placeholder={placeholder}
        hidden={previewMode}
        className={className}
      />
      <div
        ref={previewRef}
        hidden={!previewMode}
        className={className + (className ? " preview-area" : "")}
      >
        {previewMode ? <MultiParser>{previewBody}</MultiParser> : null}
      </div>
    </>
  );
}
