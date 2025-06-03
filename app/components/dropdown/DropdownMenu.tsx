import {
  type JSX,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CSSTransition } from "react-transition-group";
import { type CSSTransitionClassNames } from "react-transition-group/CSSTransition";
import { useClickEvent } from "~/components/click/useClickEvent";

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
  keepActiveOpen?: boolean;
  coverZIndex?: number;
  hiddenClassName?: string;
  ref?: React.RefObject<HTMLDivElement>;
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
  keepActiveOpen,
  coverZIndex,
  classNames: _classNames,
  hiddenClassName,
  ref,
}: DropdownObjectProps) {
  const inRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => inRef.current!);
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
      setMenuFocus(keepActiveOpen ? 3 : 2);
    } else {
      setMenuFocus(0);
    }
  }, [isOpen, keepActiveOpen]);
  const clickElm = keepActiveOpen ? useClickEvent().element : null;
  useEffect(() => {
    if (menuFocus === 1) setMenuFocus(0);
    else if (!menuFocus && !keepOpen) {
      setIsOpen(false);
    }
  }, [keepOpen, keepActiveOpen, menuFocus]);
  const activeOpen = useMemo(() => menuFocus === 3, [menuFocus]);
  useEffect(() => {
    if (activeOpen) {
      const elm = inRef?.current;
      if (elm && clickElm) {
        if (!elm.contains(clickElm)) {
          setIsOpen(false);
        }
      }
    }
  }, [activeOpen, clickElm]);
  const FillCoverWindow = useMemo(() => {
    if (isOpen && typeof coverZIndex === "number") {
      return (
        <div
          className="fillCoverWindow enabled"
          style={{ zIndex: coverZIndex }}
        />
      );
    } else return null;
  }, [isOpen, coverZIndex]);
  className = useMemo(() => {
    const list = [className ?? "dropdown"];
    if (addClassName) list.push(addClassName);
    return list.join(" ");
  }, [className, addClassName]);
  dropItemListClassName = useMemo(() => {
    const list = ["listMenu"];
    if (dropItemListClassName) list.push(dropItemListClassName);
    if (hiddenClassName && !isOpen) list.push(hiddenClassName);
    return list.join(" ");
  }, [dropItemListClassName, hiddenClassName, isOpen]);
  const timeoutStyle = useMemo<CSSProperties>(() => {
    return {
      animationDuration: cssTimeOut + "ms",
    };
  }, [cssTimeOut]);
  const dropMenuButtonOnKeyDown = useCallback(
    (e: React.KeyboardEvent<Element>) => {
      if (e.key === "Enter") toggleIsOpen();
    },
    []
  );
  const dropItemListOnClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!keepOpen && !keepActiveOpen) {
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
      }
    },
    [keepOpen, keepActiveOpen, onClick]
  );
  const dropItemListOnKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (onClick && target.tagName !== "A") {
          onClick(target);
          e.preventDefault();
        }
      }
    },
    [onClick]
  );
  return (
    <>
      <div
        className={className}
        style={style}
        tabIndex={-1}
        ref={inRef}
        onFocus={useCallback(() => {
          setMenuFocus(keepActiveOpen ? 3 : 2);
        }, [keepActiveOpen])}
        onBlur={useCallback(() => {
          if (!keepActiveOpen) setMenuFocus(1);
        }, [keepActiveOpen])}
      >
        <div className={dropMenuListClassName}>
          {typeof MenuButton === "function" ? (
            <MenuButton
              tabIndex={0}
              isOpen={isOpen}
              className={dropMenuButtonClassName}
              onClick={toggleIsOpen}
              onKeyDown={dropMenuButtonOnKeyDown}
            />
          ) : (
            <button
              className={dropMenuButtonClassName}
              type="button"
              title={title}
              onClick={toggleIsOpen}
            >
              {useMemo(
                () =>
                  (isOpen
                    ? MenuButtonWhenOpen ?? MenuButton
                    : MenuButton) as ReactNode,
                [isOpen, MenuButtonWhenOpen, MenuButton]
              )}
            </button>
          )}
          {useMemo(
            () =>
              MenuButtonAfter ? (
                <div className="list">{MenuButtonAfter}</div>
              ) : null,
            [MenuButtonAfter]
          )}
        </div>
        <CSSTransition
          in={isOpen}
          classNames={classNames}
          timeout={cssTimeOut}
          unmountOnExit={!hiddenClassName}
          nodeRef={nodeRef}
        >
          <div
            className={dropItemListClassName}
            ref={nodeRef}
            style={timeoutStyle}
            onClick={dropItemListOnClick}
            onKeyDown={dropItemListOnKeyDown}
          >
            {children}
          </div>
        </CSSTransition>
      </div>
      {FillCoverWindow}
    </>
  );
}
