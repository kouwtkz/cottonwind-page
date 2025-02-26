import { DropdownObject, DropdownObjectBaseProps } from "./DropdownMenu";
import { ReactNode } from "react";
import { RiMenuLine, RiMenuUnfold2Line } from "react-icons/ri";

export interface DropdownButtonProps extends DropdownObjectBaseProps {
  children?: ReactNode;
}
export function DropdownButton({
  children,
  classNames,
  ...props
}: DropdownButtonProps) {
  return (
    <DropdownObject
      MenuButton={<RiMenuLine />}
      MenuButtonWhenOpen={<RiMenuUnfold2Line />}
      classNames={{ dropItemList: "absolute", ...classNames }}
      {...props}
    >
      {children}
    </DropdownObject>
  );
}

export function IconsFoldButton({ classNames, ...args }: DropdownButtonProps) {
  return (
    <DropdownButton
      className="flex items-center tight"
      classNames={{
        dropMenuButton: "iconSwitch",
        dropMenuList: "icons flex items-center",
        dropItemList: "icons",
        ...classNames,
      }}
      keepOpen
      {...args}
    />
  );
}
