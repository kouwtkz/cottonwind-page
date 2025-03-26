import { scrollLock } from "@/components/hook/ScrollLock";
import CloseButton from "@/components/svg/button/CloseButton";
import {
  CSSProperties,
  HTMLAttributes,
  memo,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { CSSTransition } from "react-transition-group";
import { CSSTransitionClassNames } from "react-transition-group/CSSTransition";
import { ExitHandler } from "react-transition-group/Transition";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  classNameEntire?: string;
  onClose?: Function;
  isOpen?: boolean;
  timeout?: number;
  classNames?: CSSTransitionClassNames;
  unmountOnExit?: boolean;
  onExited?: ExitHandler<HTMLDivElement>;
  scroll?: boolean;
  scrollLock?: boolean;
}
export const Modal = memo(function Modal({
  children,
  className,
  classNameEntire,
  onClose,
  onClick,
  isOpen: propsIsOpen,
  timeout = 0,
  classNames,
  unmountOnExit = true,
  onExited,
  scroll,
  scrollLock: isScrollLock = true,
  ...props
}: ModalProps) {
  const isOpen = useMemo(() => {
    return propsIsOpen ?? true;
  }, [propsIsOpen]);
  const isNullClose = useMemo(() => {
    return typeof propsIsOpen !== "boolean";
  }, [propsIsOpen]);
  const nodeRef = useRef<HTMLDivElement>(null);
  const ClassName = useMemo(() => {
    const classes = ["modal"];
    if (className) classes.push(className);
    if (scroll) classes.push("window");
    return classes.join(" ");
  }, [className, scroll]);
  const ClassNameEntire = useMemo(() => {
    const classes = ["modalEntire"];
    if (classNameEntire) classes.push(classNameEntire);
    if (scroll) classes.push("scrollThrough");
    return classes.join(" ");
  }, [classNameEntire, scroll]);
  useEffect(() => {
    if (isNullClose) {
      scrollLock(true);
      return () => {
        scrollLock(false);
      };
    } else if (nodeRef.current) {
      if (isOpen) {
        scrollLock(true);
      } else {
        scrollLock(false);
      }
    }
  }, [isOpen, isNullClose]);
  const timeoutStyle = useMemo<CSSProperties>(() => {
    return {
      animationDuration: timeout + "ms",
    };
  }, [timeout]);
  return (
    <CSSTransition
      in={isOpen}
      {...{ classNames, timeout, unmountOnExit, nodeRef, onExited }}
    >
      <div
        ref={nodeRef}
        className={ClassNameEntire}
        style={timeoutStyle}
        onClick={(e) => {
          if (onClose && e.target === e.currentTarget) onClose();
        }}
      >
        <CloseButton
          className="modalClose cursor-pointer"
          width={60}
          height={60}
          onClick={(e) => {
            if (onClose) onClose();
            e.stopPropagation();
          }}
        />
        <div className={ClassName} {...props} onClick={onClick}>
          {children}
        </div>
      </div>
    </CSSTransition>
  );
});
