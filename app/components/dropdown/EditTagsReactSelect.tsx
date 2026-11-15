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
  type SingleValue,
  type StylesConfig,
  type ThemeConfig,
} from "react-select";
import { callReactSelectTheme } from "~/components/define/callReactSelectTheme";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CustomReactSelect } from "./CustomReactSelect";
import { RiArrowLeftRightLine } from "react-icons/ri";
type setValueFunctionType = (
  name: string,
  value: any,
  options: SetValueConfig,
) => void;

interface EditTagsReactSelectType<T extends FieldValues> {
  name: string;
  labelVisible?: boolean;
  label?: React.ReactNode;
  labelClassName?: string;
  tags: ContentsTagsOption[];
  set?: (value: React.SetStateAction<ContentsTagsOption[]>) => void;
  control: Control<T, any, any>;
  setValue: any;
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
  addButtonClassName?: string;
  formatOptionLabel?: (data: unknown) => ReactNode;
  className?: string;
  onChange?(
    newValues: SingleValue<ContentsTagsOption> | MultiValue<ContentsTagsOption>,
  ): void;
  wide?: boolean;
  switchInput?: boolean;
  switchInner?: React.ReactNode;
}
export function EditTagsReactSelect<T extends FieldValues = any>({
  name,
  labelVisible,
  label,
  labelClassName,
  tags,
  set,
  control,
  setValue: _setValue,
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
  addButtonClassName,
  formatOptionLabel,
  className,
  wide = true,
  onChange,
  switchInput,
  switchInner = <RiArrowLeftRightLine />,
}: EditTagsReactSelectType<T>) {
  className = useMemo(() => {
    const classNames = ["EditTagsReactSelect"];
    if (className) classNames.push(className);
    if (wide) classNames.push("wide");
    return classNames.join(" ");
  }, [className, wide]);
  const setValue: setValueFunctionType = _setValue;
  labelClassName = useMemo(() => {
    const labelClassnames = ["label"];
    if (labelClassName) labelClassnames.push(labelClassName);
    return labelClassnames.join(" ");
  }, [labelClassName]);
  const searchTagsList = useMemo(() => getTagsOptions(tags), [tags]);
  function addTags(value: string | string[], enableSetValue = true) {
    const values = Array.isArray(value) ? value : [value];
    if (values.length > 0) {
      const newValues = values.map((value) => ({ label: value, value }));
      if (set) set((c) => c.concat(newValues));
      if (enableSetValue)
        setValue(name, getValues(name).concat(values), {
          shouldDirty: true,
        });
    }
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
  const labelElement = useMemo(() => {
    switch (typeof label) {
      case "string":
      case "number":
        return <span>{label}</span>;
      default:
        if (label) return label;
        else return null;
    }
  }, [label]);

  const inputSwitchRef = useRef<HTMLInputElement>(null);
  const [inputSwitchState, setInputSwitchState] = useState(false);
  const inputSwitchCallback = useCallback(() => {
    if (inputSwitchRef.current) {
      const list = inputSwitchRef.current.value
        .split(",")
        .filter((v) => !searchTagsList.some((tag) => tag.value === v));
      addTags(list, false);
    }
  }, [tags]);

  return (
    <>
      {labelVisible ? (
        <div className={labelClassName}>
          {labelElement}
          {addButtonVisible ? (
            <button
              title={addButtonTitle}
              type="button"
              className={addButtonClassName}
              onClick={() => addTagsPrompt()}
              disabled={isBusy}
            >
              {addButtonNode}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className={className}>
        <Controller
          control={control as Control<any, any, any>}
          name={name}
          render={({ field }) => {
            let inner: ReactNode;
            if (inputSwitchState) {
              inner = (
                <input
                  type="text"
                  ref={inputSwitchRef}
                  defaultValue={field.value}
                  className="Select"
                  onInput={(e) => {
                    field.onChange(
                      (e.target as HTMLInputElement).value.split(","),
                    );
                  }}
                />
              );
            } else {
              inner = (
                <CustomReactSelect
                  isSearchable={true}
                  instanceId={name + "Select"}
                  isMulti
                  theme={theme}
                  styles={styles}
                  options={tags}
                  value={((field.value as string[]) || []).map((fv) =>
                    searchTagsList.find((ci) => ci.value === fv),
                  )}
                  formatOptionLabel={formatOptionLabel}
                  placeholder={placeholder}
                  onChange={(newValues) => {
                    isEnterAction.current = false;
                    field.onChange(
                      (
                        newValues as MultiValue<ContentsTagsOption | undefined>
                      ).map((v) => v?.value),
                    );
                    if (onChange) onChange(newValues);
                  }}
                  onKeyDown={addKeydownEnter}
                  onBlur={field.onBlur}
                  isDisabled={isBusy}
                />
              );
            }
            return <>{inner}</>;
          }}
        />
        {switchInput ? (
          <div className="switch">
            <button
              type="button"
              className="color usually"
              onClick={() => {
                if (inputSwitchState) {
                  inputSwitchCallback();
                }
                setInputSwitchState(!inputSwitchState);
              }}
            >
              {typeof switchInner === "string" ? (
                <span>{switchInner}</span>
              ) : (
                switchInner
              )}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
