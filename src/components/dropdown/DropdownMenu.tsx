import {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CSSTransition } from "react-transition-group";
import { CSSTransitionClassNames } from "react-transition-group/CSSTransition";

export interface InsertElementProps extends HTMLAttributes<Element> {
  isOpen: boolean;
}

export type MenuButtonType =
  | ((args: InsertElementProps) => JSX.Element)
  | ReactNode;

interface ClassNamesType extends CSSTransitionClassNames {
  dropItemList?: string;
  dropMenuList?: string;
  dropMenuButton?: string;
}

export interface DropdownObjectBaseProps {
  className?: string;
  classNames?: ClassNamesType;
  addClassName?: string;
  style?: CSSProperties;
  MenuButton?: MenuButtonType;
  MenuButtonWhenOpen?: ReactNode;
  title?: string;
  MenuButtonAfter?: ReactNode;
  keepOpen?: boolean;
}

export interface DropdownObjectProps extends DropdownObjectBaseProps {
  children?: ReactNode;
  onClick?: (e: HTMLElement) => boolean | void;
  cssTimeOut?: number;
  clickTimeOut?: number;
  classNames?: ClassNamesType;
}

export function DropdownObject({
  className,
  addClassName,
  style,
  MenuButton,
  MenuButtonWhenOpen,
  MenuButtonAfter,
  title,
  children,
  onClick,
  cssTimeOut = 0,
  clickTimeOut = 0,
  keepOpen,
  classNames: _classNames,
}: DropdownObjectProps) {
  let {
    dropMenuButton: dropMenuButtonClassName,
    dropItemList: dropItemListClassName,
    dropMenuList: dropMenuListClassName,
    classNames,
  } = useMemo(() => {
    const {
      dropMenuButton = "color",
      dropItemList,
      dropMenuList = "menu list",
      ..._cns
    } = _classNames || {};
    const classNames = Object.keys(_cns).length > 0 ? _cns : undefined;
    return { dropMenuButton, dropItemList, dropMenuList, classNames };
  }, [_classNames]);

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
    else if (!menuFocus && !keepOpen) setIsOpen(false);
  }, [keepOpen, menuFocus]);
  className = useMemo(() => {
    const list = [className ?? "dropdown"];
    if (addClassName) list.push(addClassName);
    return list.join(" ");
  }, [className, addClassName]);
  dropItemListClassName = useMemo(() => {
    const list = ["listMenu"];
    if (dropItemListClassName) list.push(dropItemListClassName);
    return list.join(" ");
  }, [dropItemListClassName]);
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
      <div className={dropMenuListClassName}>
        {typeof MenuButton === "function" ? (
          <MenuButton
            tabIndex={0}
            isOpen={isOpen}
            className={dropMenuButtonClassName}
            onClick={toggleIsOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter") toggleIsOpen();
            }}
          />
        ) : (
          <button
            className={dropMenuButtonClassName}
            type="button"
            title={title}
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
          className={dropItemListClassName}
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
