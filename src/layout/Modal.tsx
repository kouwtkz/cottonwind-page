import { scrollLock } from "@/components/hook/ScrollLock";
import CloseButton from "@/components/svg/button/CloseButton";
import { HTMLAttributes, useEffect, useMemo } from "react";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  classNameEntire?: string;
  onClose?: Function;
}
export function Modal({
  children,
  className,
  classNameEntire,
  onClose,
  onClick,
  ...props
}: ModalProps) {
  const ClassName = useMemo(() => {
    const classes = ["modal"];
    if (className) classes.push(className);
    return classes.join(" ");
  }, [className]);
  const ClassNameEntire = useMemo(() => {
    const classes = ["modalEntire"];
    if (classNameEntire) classes.push(classNameEntire);
    return classes.join(" ");
  }, [classNameEntire]);
  useEffect(() => {
    scrollLock(true);
    return function () {
      scrollLock(false);
    };
  }, [className]);
  return (
    <div
      className={ClassNameEntire}
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
  );
}
