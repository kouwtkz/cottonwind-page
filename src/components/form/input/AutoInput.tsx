import { createElement } from "react";
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import * as z from "zod";

export type AutoInputItemType = {
  label?: string;
  name: string;
  type: string;
  schema: z.ZodString;
};

export function MakeSchemaObject(list: AutoInputItemType[]) {
  return z.object(
    list.reduce((a, c) => ({ ...a, ...{ [c.name]: c.schema } }), {} as any)
  );
}

type AutoInputProps = {
  item: AutoInputItemType;
  disabled?: boolean;
  register: UseFormRegister<FieldValues>;
  className?: string;
  inputClassName?: string;
  textareaClassName?: string;
  labelClassName?: string;
  spanClassName?: string;
  errors?: FieldErrors<FieldValues>;
  errorClassName?: string;
};

export default function AutoInput({
  item,
  register,
  disabled = false,
  className = "m-4",
  inputClassName = "flex-[1.6] px-2",
  textareaClassName = "flex-[1.6] px-2 h-24",
  labelClassName = "flex justify-center items-center",
  spanClassName = "flex-[1] text-right mr-2",
  errors,
  errorClassName = "my-3 text-sm text-red-500",
}: AutoInputProps) {
  const registId = item.name;
  let tag = "input";
  let tagClass = inputClassName;
  let type = "";
  switch (item.type) {
    case "textarea":
      tag = item.type;
      tagClass = textareaClassName;
      break;
    default:
      type = item.type;
      break;
  }
  const inputTag = createElement(tag, {
    className: tagClass,
    disabled,
    ...(type ? { type } : {}),
    ...register(registId, { required: true }),
  });
  const labeled = item.label ? (
    <label className={labelClassName}>
      <span className={spanClassName}>{item.label}</span>
      {inputTag}
    </label>
  ) : (
    <>{inputTag}</>
  );
  const errorTag = (errors && errors[registId] && (
    <div className={errorClassName}>{String(errors[registId]?.message)}</div>
  )) || <></>;
  return (
    <div className={className}>
      {labeled}
      {errorTag}
    </div>
  );
}
