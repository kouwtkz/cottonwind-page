import {
  Controller,
  type Control,
  type FieldValues,
  type SetValueConfig,
  type UseFormGetValues,
} from "react-hook-form";
import { getTagsOptions } from "./SortFilterTags";
import ReactSelect, {
  type MultiValue,
  type StylesConfig,
  type ThemeConfig,
} from "react-select";
import { callReactSelectTheme } from "~/components/define/callReactSelectTheme";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CustomReactSelect } from "./CustomReactSelect";
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
  formatOptionLabel?: (data: unknown) => ReactNode;
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
  formatOptionLabel,
}: EditTagsReactSelectType) {
  const searchTagsList = useMemo(() => getTagsOptions(tags), [tags]);
  function addTags(value: string) {
    const newValues = { label: value, value };
    if (set) set((c) => c.concat(newValues));
    setValue(name, getValues(name).concat(value), {
      shouldDirty: true,
    });
  }
  const isEnterAction = useRef(false);
  function addTagsPrompt() {
    const answer = prompt(promptQuestion);
    if (answer !== null) addTags(answer);
  }
  function addKeydownEnter(e: React.KeyboardEvent<HTMLDivElement>) {
    if (enableEnterAdd && e.key === "Enter" && !e.ctrlKey) {
      isEnterAction.current = true;
      setTimeout(() => {
        if (isEnterAction.current) {
          const input = e.target as HTMLInputElement;
          if (input.value) {
            addTags(input.value);
            input.blur();
            input.focus();
          }
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
              className="color"
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
            <CustomReactSelect
              isSearchable={true}
              instanceId={name + "Select"}
              isMulti
              theme={theme}
              styles={styles}
              options={tags}
              value={(field.value as string[]).map((fv) =>
                searchTagsList.find((ci) => ci.value === fv)
              )}
              formatOptionLabel={formatOptionLabel}
              placeholder={placeholder}
              onChange={(newValues) => {
                isEnterAction.current = false;
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
