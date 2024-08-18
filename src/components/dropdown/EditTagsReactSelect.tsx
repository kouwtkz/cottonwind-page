import {
  Control,
  Controller,
  FieldValues,
  SetValueConfig,
  UseFormGetValues,
} from "react-hook-form";
import { ContentsTagsOption } from "./SortFilterTags";
import ReactSelect, {
  MultiValue,
  StylesConfig,
  ThemeConfig,
} from "react-select";
import { callReactSelectTheme } from "@/theme/main";
import { ReactNode, useMemo } from "react";
type setValueFunctionType = (
  name: string,
  value: any,
  options: SetValueConfig
) => void;

interface EditTagsReactSelectType {
  name: string;
  labelVisible?: boolean;
  label?: string;
  tags: ContentsTagsOption[];
  set?: (value: React.SetStateAction<ContentsTagsOption[]>) => void;
  control: Control<FieldValues, any>;
  setValue: setValueFunctionType;
  getValues: UseFormGetValues<any>;
  isBusy?: boolean;
  placeholder?: string;
  promptQuestion?: string;
  addButtonVisible?: boolean;
  addButtonTitle?: string;
  addButtonNode?: ReactNode;
  enableEnterAdd?: boolean;
  theme?: ThemeConfig;
  styles?: StylesConfig;
}
export function EditTagsReactSelect({
  name,
  labelVisible,
  label,
  tags,
  set,
  control,
  setValue,
  getValues,
  isBusy,
  placeholder,
  promptQuestion = "追加するタグの名前を入力してください",
  addButtonVisible,
  addButtonTitle = "新規タグ",
  addButtonNode = "＋新規タグの追加",
  enableEnterAdd,
  theme = callReactSelectTheme,
  styles,
}: EditTagsReactSelectType) {
  function addTags(value: string) {
    const newValues = { label: value, value };
    if (set) set((c) => c.concat(newValues));
    setValue(name, getValues(name).concat(value), {
      shouldDirty: true,
    });
  }
  function addTagsPrompt() {
    const answer = prompt(promptQuestion);
    if (answer !== null) addTags(answer);
  }
  function addKeydownEnter(e: React.KeyboardEvent<HTMLDivElement>) {
    if (enableEnterAdd && e.key === "Enter" && !e.ctrlKey) {
      setTimeout(() => {
        const input = e.target as HTMLInputElement;
        const value = input.value;
        if (value) {
          addTags(value);
          input.blur();
          input.focus();
        }
      }, 50);
    }
  }
  return (
    <>
      {labelVisible ? (
        <div className="label">
          {label ? <span>{label}</span> : null}
          {addButtonVisible ? (
            <button
              title={addButtonTitle}
              type="button"
              onClick={() => addTagsPrompt()}
              disabled={isBusy}
            >
              {addButtonNode}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="wide">
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <ReactSelect
              instanceId={name + "Select"}
              isMulti
              theme={theme}
              styles={styles}
              options={tags}
              value={(field.value as string[]).map((fv) =>
                tags.find((ci) => ci.value === fv)
              )}
              placeholder={placeholder}
              onChange={(newValues) => {
                field.onChange(
                  (newValues as MultiValue<ContentsTagsOption | undefined>).map(
                    (v) => v?.value
                  )
                );
              }}
              onKeyDown={(e) => {
                addKeydownEnter(e);
              }}
              onBlur={field.onBlur}
              isDisabled={isBusy}
            />
          )}
        />
      </div>
    </>
  );
}
