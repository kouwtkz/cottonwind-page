import React, { useMemo } from "react";
import { DropdownObject } from "./DropdownMenu";
import { MdOutlineMenu, MdOutlineMenuOpen } from "react-icons/md";

interface RbButtonAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  dropdown?: React.ReactNode;
  zIndex?: number;
}
export function RbButtonArea({
  dropdown,
  children,
  zIndex = 30,
  style,
  className,
  ...props
}: RbButtonAreaProps) {
  className = useMemo(() => {
    const classes = ["rbButtonArea"];
    if (className) classes.push(className);
    return classes.join(" ");
  }, [className]);
  return (
    <div className={className} style={{ zIndex, ...style }} {...props}>
      {dropdown ? (
        <DropdownObject
          addClassName="flex on right row transparent"
          MenuButtonClassName="color round large"
          MenuButtonTitle="メニュー"
          MenuButton={<MdOutlineMenu />}
          MenuButtonWhenOpen={<MdOutlineMenuOpen />}
          MenuButtonAfter={children}
        >
          {dropdown}
        </DropdownObject>
      ) : (
        children
      )}
    </div>
  );
}
