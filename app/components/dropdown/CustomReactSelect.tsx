import ReactSelect, {
  components,
} from "react-select";
import type {
  Props,
  GroupBase,
  OnChangeValue,
  ActionMeta,
  PropsValue,
  FormatOptionLabelMeta,
  StylesConfig,
} from "react-select";
import { useCallback, useMemo, useState } from "react";
import { kanaToHira } from "~/components/functions/doc/StrFunctions";

interface CustomReactSelectProps<IsMulti extends boolean>
  extends Omit<
    Props<ContentsTagsOption, IsMulti>,
    "options" | "styles" | "value"
  > {
  options: Array<ContentsTagsOption>;
  styles?: StylesConfig<any, IsMulti>;
  value?: unknown;
}

export function CustomReactSelect<IsMulti extends boolean = boolean>({
  components: { ValueContainer, ...propsComponents } = {},
  onMenuClose,
  options,
  value,
  onChange,
  formatOptionLabel,
  styles,
  isSearchable: propsIsSearchable,
  ...props
}: CustomReactSelectProps<IsMulti>) {
  const [stateIsSearchable, setIsSearchable] = useState(false);
  const enablePropsIsSearchable = useMemo(
    () => typeof propsIsSearchable === "boolean",
    [propsIsSearchable]
  );
  const isSearchable = useMemo(
    () =>
      (enablePropsIsSearchable ? propsIsSearchable : stateIsSearchable) ||
      false,
    [enablePropsIsSearchable, propsIsSearchable, stateIsSearchable]
  );
  function ES_P(e: HTMLElement) {
    if (/select/.test(e.className)) return e;
    else if (e.parentElement) return ES_P(e.parentElement);
    else return e;
  }
  function EnableSearchable(e: React.UIEvent<HTMLDivElement>) {
    const target = ES_P(e.target as HTMLElement);
    if (!propsIsSearchable && !/remove/.test(target.className))
      setIsSearchable(true);
  }
  const toMap = useCallback((options: ContentsTagsOption[]) => {
    const map = new Map<
      string,
      { value: ContentsTagsOption; custom?: ContentsTagsOption }
    >();
    function fn(options: ContentsTagsOption[]) {
      options.forEach((v) => {
        if (v.options) return fn(v.options);
        else {
          const key = v.value || v.label;
          if (key) map.set(key, { value: v });
        }
      });
    }
    fn(options);
    return map;
  }, []);
  const optionsMap = useMemo(() => {
    return toMap(options);
  }, [options]);
  const customOptions = useMemo(() => {
    function fn(options: ContentsTagsOption[]): ContentsTagsOption[] {
      return options
        .map((v) => {
          v = { ...v };
          if (v.options) {
            v.options = fn(v.options);
            return v;
          } else {
            v.rawValue = v.value;
            const found = optionsMap.get(v.value || v.label || "");
            if (found) {
              found.custom = v;
              const base = v.label || v.nameGuide?.toString() || v.value || "";
              const hira = kanaToHira(base)
                .replaceAll("月", "がつ(つき)")
                .replaceAll("順", "じゅん");
              const values = [v.value ? v.value : base];
              if (base !== hira) values.push(hira);
              if (v.nameGuide)
                values.push(
                  ...(Array.isArray(v.nameGuide) ? v.nameGuide : [v.nameGuide])
                );
              v.value = values.join(",");
              return v;
            } else return null!;
          }
        })
        .filter((v) => v);
    }
    return fn(options);
  }, [options, optionsMap]);
  const changeHandler = useCallback(
    (
      newValue: OnChangeValue<ContentsTagsOption, IsMulti>,
      actionMeta: ActionMeta<ContentsTagsOption>
    ) => {
      const isMulti = Array.isArray(newValue);
      const splitValues = (
        (isMulti ? newValue : [newValue]) as ContentsTagsOption[]
      ).map(
        (v) =>
          optionsMap.get((v.value || v.label || "").split(",", 1)[0])!.value
      );
      if (onChange)
        onChange(
          (isMulti ? splitValues : splitValues[0]) as OnChangeValue<
            ContentsTagsOption,
            IsMulti
          >,
          actionMeta
        );
    },
    [onChange, optionsMap]
  );
  const customValue = useMemo(() => {
    function find(v: ContentsTagsOption) {
      const found = optionsMap.get(v.value || v.label || "");
      return found ? found.custom || found.value : null;
    }
    const v = value as ContentsTagsOption | ContentsTagsOption[];
    if (v) {
      if (Array.isArray(v)) {
        return v.map((v) => (v ? find(v) || v : null)!).filter((v) => v);
      } else {
        return v ? find(v) || v : null;
      }
    } else return v;
  }, [value, optionsMap]);
  const customFormatOptionLabel = useMemo(() => {
    if (formatOptionLabel) {
      return (
        data: ContentsTagsOption,
        formatOptionLabelMeta: FormatOptionLabelMeta<ContentsTagsOption>
      ) => {
        const { rawValue, ...argsData } = data;
        if (rawValue) argsData.value = rawValue;
        return formatOptionLabel(argsData, formatOptionLabelMeta);
      };
    } else return formatOptionLabel;
  }, []);
  return (
    <ReactSelect
      isSearchable={isSearchable}
      options={customOptions}
      value={customValue}
      onChange={changeHandler}
      formatOptionLabel={customFormatOptionLabel}
      styles={styles}
      {...props}
      components={{
        ...propsComponents,
        ValueContainer: (rest) => (
          <div onTouchStart={EnableSearchable} onMouseDown={EnableSearchable}>
            {ValueContainer ? (
              <ValueContainer {...rest} />
            ) : (
              <components.ValueContainer {...rest} />
            )}
          </div>
        ),
      }}
      onMenuClose={() => {
        if (!propsIsSearchable) setIsSearchable(false);
        if (onMenuClose) onMenuClose();
      }}
    />
  );
}

export function CountToContentsTagsOption(
  value: ValueCountType[],
  property?: string
) {
  return value.map(
    (v) =>
    ({
      label: `${v.value} (${v.count})`,
      value: property ? `${property}:${v.value}` : v.value,
    } as ContentsTagsOption)
  );
}
