import ReactSelect, { components, Props, GroupBase } from "react-select";
import { useState } from "react";

export function CustomReactSelect<
  Option = unknown,
  IsMulti extends boolean = boolean,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  components: { ValueContainer, ...propsComponents } = {},
  onMenuClose,
  ...props
}: Props<Option, IsMulti, Group>) {
  const [isSearchable, setIsSearchable] = useState(false);
  function EnableSearchable() {
    setIsSearchable(true);
  }
  return (
    <ReactSelect
      isSearchable={isSearchable}
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
        setIsSearchable(false);
        if (onMenuClose) onMenuClose();
      }}
    />
  );
}
