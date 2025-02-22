import {
  CSSProperties,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CSSTransition } from "react-transition-group";

export interface InsertElementProps extends HTMLAttributes<Element> {
  isOpen: boolean;
}

export type MenuButtonType =
  | ((args: InsertElementProps) => JSX.Element)
  | ReactNode;

export interface DropdownObjectBaseProps {
  className?: string;
  addClassName?: string;
  style?: CSSProperties;
  MenuButton?: MenuButtonType;
  MenuButtonWhenOpen?: ReactNode;
  MenuButtonTitle?: string;
  MenuButtonClassName?: string;
  MenuButtonAfter?: ReactNode;
  autoClose?: boolean;
  listClassName?: string;
}

export interface DropdownObjectProps extends DropdownObjectBaseProps {
  children?: ReactNode;
  onClick?: (e: HTMLElement) => boolean | void;
  cssTimeOut?: number;
  clickTimeOut?: number;
  classNames?: string;
}

export function DropdownObject({
  className,
  addClassName,
  style,
  MenuButton,
  MenuButtonWhenOpen,
  MenuButtonAfter,
  MenuButtonTitle,
  MenuButtonClassName = "color",
  listClassName,
  children,
  onClick,
  cssTimeOut = 0,
  clickTimeOut = 0,
  autoClose = true,
  classNames,
}: DropdownObjectProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuFocus, setMenuFocus] = useState(0);
  const toggleIsOpen = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  useEffect(() => {
    if (isOpen) {
      setMenuFocus(2);
    }
  }, [isOpen]);
  useEffect(() => {
    if (menuFocus === 1) setMenuFocus(0);
    else if (!menuFocus && autoClose) setIsOpen(false);
  }, [autoClose, menuFocus]);
  className = useMemo(() => {
    const list = [className ?? "dropdown"];
    if (addClassName) list.push(addClassName);
    return list.join(" ");
  }, [className, addClassName]);
  listClassName = useMemo(() => {
    const list = ["listMenu"];
    if (listClassName) list.push(listClassName);
    return list.join(" ");
  }, [listClassName]);
  const timeoutStyle = useMemo<CSSProperties>(() => {
    return {
      animationDuration: cssTimeOut + "ms",
    };
  }, [cssTimeOut]);
  return (
    <div
      className={className}
      style={style}
      tabIndex={-1}
      onFocus={() => {
        setMenuFocus(2);
      }}
      onBlur={() => {
        setMenuFocus(1);
      }}
    >
      <div className="menu list">
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
            {isOpen ? MenuButtonWhenOpen ?? MenuButton : MenuButton}
          </button>
        )}
        {MenuButtonAfter ? <div className="list">{MenuButtonAfter}</div> : null}
      </div>
      <CSSTransition
        in={isOpen}
        classNames={classNames}
        timeout={cssTimeOut}
        unmountOnExit
        nodeRef={nodeRef}
      >
        <div
          className={listClassName}
          ref={nodeRef}
          style={timeoutStyle}
          onClick={(e) => {
            let close: boolean;
            if (onClick) close = onClick(e.target as HTMLElement) ?? true;
            else close = true;
            if (close) {
              if (clickTimeOut)
                setTimeout(() => {
                  setMenuFocus(0);
                }, clickTimeOut);
              else setMenuFocus(0);
            }
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
      </CSSTransition>
    </div>
  );
}
