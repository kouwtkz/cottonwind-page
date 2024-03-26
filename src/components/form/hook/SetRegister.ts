import { FieldValues, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import SetRef from "./SetRef";
import SetOnChange from "./SetOnChange";
import { ChangeEventHandler } from "react";

export type SetRegisterReturn = UseFormRegisterReturn<string> | { onChange: ChangeEventHandler };

export default function SetRegister<T>(
  {
    name, ref: setRef, onChange: setOnChange, register
  }: {
    name: string,
    ref?: React.MutableRefObject<T | null>,
    onChange?: React.ChangeEventHandler<T>,
    register: UseFormRegister<FieldValues>,
  }
) {
  const { ref, onChange, ...rest } = register(name);
  return {
    ref: setRef ? SetRef(setRef, ref) : ref,
    onChange: setOnChange ? SetOnChange(setOnChange, onChange) : onChange,
    ...rest
  }
}
