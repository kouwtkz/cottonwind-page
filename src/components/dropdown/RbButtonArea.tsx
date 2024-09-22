import React from "react";
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
  ...props
}: RbButtonAreaProps) {
  return (
    <div className="rbButtonArea" style={{ zIndex, ...style }} {...props}>
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
