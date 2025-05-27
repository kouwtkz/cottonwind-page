import { SetRegisterReturn } from "../hook/SetRegister";
import { MultiParserWithMedia as MultiParser } from "./MultiParserWithMedia";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreateObjectState } from "@/state/CreateState";
import {
  FieldPath,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { RegisterRef } from "../hook/SetRef";
import {
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "../dropdown/PostEditSelect";

type PreviewModeType = {
  previewMode: boolean;
  previewBody?: string;
};
type PreviewModeStateType = PreviewModeType & {
  setPreviewMode: (option: PreviewModeType) => void;
  togglePreviewMode: (body?: string) => void;
};

interface PostTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  registed?: SetRegisterReturn;
  mode?: boolean | "true" | "false" | "both";
  body?: string;
}
export function PostTextarea({
  registed,
  disabled,
  id,
  title,
  placeholder,
  className,
  mode: previewMode = false,
  body: previewBody,
  ...props
}: PostTextareaProps) {
  className = useMemo(() => {
    const divClassNames = ["postTextarea"];
    if (className) divClassNames.push(className);
    return divClassNames.join(" ");
  }, [className]);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewClassName = useMemo(() => {
    const classNames: string[] = ["preview-area"];
    return classNames.join(" ");
  }, [className]);
  const hiddenTextarea = useMemo(() => {
    return typeof previewMode === "string"
      ? previewMode === "true"
      : previewMode;
  }, [previewMode]);
  const hiddenParsed = useMemo(() => {
    return typeof previewMode === "string"
      ? previewMode !== "true" && previewMode !== "both"
      : !previewMode;
  }, [previewMode]);
  return (
    <div className={className}>
      <textarea
        disabled={disabled}
        id={id}
        title={title}
        placeholder={placeholder}
        hidden={hiddenTextarea}
        {...props}
        {...registed}
      />
      <div ref={previewRef} hidden={hiddenParsed} className={previewClassName}>
        {hiddenParsed ? null : <MultiParser>{previewBody}</MultiParser>}
      </div>
    </div>
  );
}

interface TextareaWithPreviewProps<
  TFieldValues extends FieldValues = FieldValues
> {
  name: FieldPath<TFieldValues>;
  title?: string;
  placeholder?: string;
  setValue: UseFormSetValue<TFieldValues>;
  watch: <TFieldValues>(name: TFieldValues) => any;
  register: UseFormRegister<TFieldValues>;
}
export function TextareaWithPreview<
  TFieldValues extends FieldValues = FieldValues
>({
  name,
  title,
  placeholder,
  setValue,
  watch,
  register,
}: TextareaWithPreviewProps<TFieldValues>) {
  const [previewMode, setPreviewMode] = useState(false);
  const ref = useRef<HTMLTextAreaElement>();
  const { refPassthrough: dscRefPassthrough, registered: registerDescription } =
    RegisterRef({
      useRefValue: ref,
      registerValue: register(name),
    });
  function setTextarea(v: any) {
    setValue(name, v, {
      shouldDirty: true,
    });
  }

  return (
    <div>
      <div className="label simple">
        <PostEditSelectMedia textarea={ref.current} setValue={setTextarea} />
        <PostEditSelectDecoration
          textarea={ref.current}
          setValue={setTextarea}
        />
        <PostEditSelectInsert textarea={ref.current} setValue={setTextarea} />
        <button
          title="プレビューモードの切り替え"
          type="button"
          className="color"
          onClick={() => setPreviewMode((v) => !v)}
        >
          {previewMode ? "編集に戻る" : "プレビュー"}
        </button>
      </div>
      <div className="wide">
        <PostTextarea
          registed={{ ...registerDescription, ref: dscRefPassthrough }}
          title={title}
          placeholder={placeholder}
          mode={previewMode}
          body={watch(name)}
        />
      </div>
    </div>
  );
}
