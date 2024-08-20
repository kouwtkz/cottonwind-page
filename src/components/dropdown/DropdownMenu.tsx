import {
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface InsertElementProps extends HTMLAttributes<Element> {
  isOpen: boolean;
}

export type MenuButtonType =
  | ((args: InsertElementProps) => JSX.Element)
  | ReactNode;

export interface DropdownObjectBaseProps {
  className?: string;
  MenuButton?: MenuButtonType;
  MenuButtonTitle?: string;
  MenuButtonClassName?: string;
  autoClose?: boolean;
}

interface DropdownObjectProps extends DropdownObjectBaseProps {
  children?: ReactNode;
  onClick?: (e: HTMLElement) => void;
  onClickFadeOutTime?: number;
}

export function DropdownObject({
  className,
  MenuButton,
  MenuButtonTitle,
  MenuButtonClassName,
  children,
  onClick,
  onClickFadeOutTime,
  autoClose = true,
}: DropdownObjectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuFocus, setMenuFocus] = useState(false);
  const [_menuFocus, _setMenuFocus] = useState(false);
  const toggleIsOpen = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  useEffect(() => {
    if (isOpen) {
      setMenuFocus(true);
    }
  }, [isOpen]);
  useEffect(() => {
    if (autoClose) _setMenuFocus(menuFocus);
  }, [menuFocus]);
  useEffect(() => {
    if (!_menuFocus) setIsOpen(false);
  }, [_menuFocus]);
  return (
    <div
      className={className ?? "dropdown"}
      tabIndex={-1}
      onFocus={() => {
        setMenuFocus(true);
      }}
      onBlur={() => {
        setMenuFocus(false);
      }}
    >
      {typeof MenuButton === "function" ? (
        <MenuButton
          tabIndex={0}
          isOpen={isOpen}
          className={MenuButtonClassName}
          onClick={toggleIsOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter") toggleIsOpen();
          }}
        />
      ) : (
        <button
          className={MenuButtonClassName}
          type="button"
          title={MenuButtonTitle}
          onClick={toggleIsOpen}
        >
          {MenuButton}
        </button>
      )}
      <div
        className="list"
        hidden={!isOpen}
        onClick={(e) => {
          if (onClick) onClick(e.target as HTMLElement);
          if (onClickFadeOutTime)
            setTimeout(() => {
              setMenuFocus(false);
            }, onClickFadeOutTime);
          else setMenuFocus(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const target = e.target as HTMLElement;
            if (onClick && target.tagName !== "A") {
              onClick(target);
              e.preventDefault();
            }
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
