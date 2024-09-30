import { MdOutlineMenu, MdOutlineMenuOpen } from "react-icons/md";
import { DropdownObject, DropdownObjectBaseProps } from "./DropdownMenu";
import { ReactNode } from "react";

export function DropdownButton({
  children,
  ...props
}: DropdownObjectBaseProps & { children?: ReactNode }) {
  return (
    <DropdownObject
      MenuButton={<MdOutlineMenu />}
      MenuButtonWhenOpen={<MdOutlineMenuOpen />}
      listClassName="absolute"
      {...props}
    >
      {children}
    </DropdownObject>
  );
}
