import { SetRegisterReturn } from "../hook/SetRegister";
import { MultiParserWithMedia as MultiParser } from "./MultiParserWithMedia";
import { useEffect, useMemo, useRef } from "react";
import { CreateObjectState } from "@/state/CreateState";
import {
  FieldPath,
  FieldValues,
  UseFormGetValues,
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

export const usePreviewMode = CreateObjectState<PreviewModeStateType>(
  (set) => ({
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
  })
);

interface PostTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  registed?: SetRegisterReturn;
}
export function PostTextarea({
  registed,
  disabled,
  id,
  title,
  placeholder,
  className = "postTextarea",
  ...props
}: PostTextareaProps) {
  const { previewMode, previewBody, setPreviewMode } = usePreviewMode();
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setPreviewMode({ previewMode: false, previewBody: "" });
  }, []);
  const previewClassName = useMemo(() => {
    const classNames: string[] = [className];
    classNames.push("preview-area");
    return classNames.join(" ");
  }, [className]);
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
        {...props}
      />
      <div ref={previewRef} hidden={!previewMode} className={previewClassName}>
        {previewMode ? <MultiParser>{previewBody}</MultiParser> : null}
      </div>
    </>
  );
}

interface TextareaWithPreviewProps<
  TFieldValues extends FieldValues = FieldValues
> {
  name: FieldPath<TFieldValues>;
  title?: string;
  placeholder?: string;
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
}
export function TextareaWithPreview<
  TFieldValues extends FieldValues = FieldValues
>({
  name,
  title,
  placeholder,
  setValue,
  getValues,
  register,
}: TextareaWithPreviewProps<TFieldValues>) {
  const { previewMode, togglePreviewMode } = usePreviewMode();
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
          onClick={() => togglePreviewMode(getValues(name))}
        >
          {previewMode ? "編集に戻る" : "プレビュー"}
        </button>
      </div>
      <div className="wide">
        <PostTextarea
          registed={{ ...registerDescription, ref: dscRefPassthrough }}
          title={title}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
