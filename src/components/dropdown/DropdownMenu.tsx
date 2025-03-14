import {
  CSSProperties,
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
import { CSSTransitionClassNames } from "react-transition-group/CSSTransition";
import { useClickEvent } from "@/components/hook/useClickEvent";

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
  }, [isOpen]);
  const clickElm = keepActiveOpen ? useClickEvent().element : null;
  useEffect(() => {
    if (menuFocus === 1) setMenuFocus(0);
    else if (!menuFocus && !keepOpen) {
      setIsOpen(false);
    }
  }, [keepOpen, keepActiveOpen, menuFocus]);
  useEffect(() => {
    if (menuFocus === 3) {
      const elm = inRef?.current;
      if (elm && clickElm) {
        if (!elm.contains(clickElm)) {
          setIsOpen(false);
        }
      }
    }
  }, [menuFocus, clickElm]);
  className = useMemo(() => {
    const list = [className ?? "dropdown"];
    if (addClassName) list.push(addClassName);
    return list.join(" ");
  }, [className, addClassName, isOpen]);
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
    [keepOpen, keepActiveOpen]
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
    []
  );
  return (
    <div
      className={className}
      style={style}
      tabIndex={-1}
      ref={inRef}
      onFocus={useCallback(() => {
        setMenuFocus(keepActiveOpen ? 3 : 2);
      }, [])}
      onBlur={useCallback(() => {
        if (!keepActiveOpen) setMenuFocus(1);
      }, [])}
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
              [isOpen]
            )}
          </button>
        )}
        {useMemo(
          () =>
            MenuButtonAfter ? (
              <div className="list">{MenuButtonAfter}</div>
            ) : null,
          []
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
  );
}
