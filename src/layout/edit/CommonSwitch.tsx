import { CreateStateFunctionType } from "@/state/CreateState";
import { forwardRef, HTMLAttributes, ReactNode, useMemo } from "react";
import { AiOutlinePlus, AiOutlineTool } from "react-icons/ai";
import { MdClose, MdDoneOutline } from "react-icons/md";
import { TbArrowsMove } from "react-icons/tb";
import { Link, useSearchParams } from "react-router-dom";

interface ModeSwitchProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "ref" | "onClick"> {
  enableTitle?: string;
  disableTitle?: string;
  beforeOnClick?: (
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => boolean;
  useSwitch: CreateStateFunctionType<boolean>;
}
export const ModeSwitch = forwardRef<HTMLButtonElement, ModeSwitchProps>(
  function ModeSwitch(
    {
      enableTitle = "有効にする",
      disableTitle = "元に戻す",
      children = <AiOutlineTool />,
      useSwitch,
      beforeOnClick,
      ...props
    },
    ref
  ) {
    const [isEnable, setIsEnable] = useSwitch();
    return (
      <button
        title={isEnable ? disableTitle : enableTitle}
        type="button"
        className="iconSwitch"
        onClick={(e) => {
          if (!beforeOnClick || beforeOnClick(e)) setIsEnable(!isEnable);
        }}
        style={{ opacity: isEnable ? 1 : 0.4 }}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

interface ModeSearchSwitchProps
  extends Omit<HTMLAttributes<HTMLAnchorElement>, "ref" | "onClick"> {
  enableTitle?: string;
  disableTitle?: string;
  searchKey: string;
}
export const ModeSearchSwitch = forwardRef<
  HTMLAnchorElement,
  ModeSearchSwitchProps
>(function ModeSearchSwitch(
  {
    enableTitle = "有効にする",
    disableTitle = "元に戻す",
    children = <AiOutlineTool />,
    searchKey,
    ...props
  },
  ref
) {
  const searchParams = useSearchParams()[0];
  const [isEnable, href] = useMemo(() => {
    const has = searchParams.has(searchKey);
    if (has) searchParams.delete(searchKey);
    else searchParams.set(searchKey, "on");
    return [has, searchParams.size ? "?" + searchParams.toString() : ""];
  }, [searchKey, searchParams]);
  return (
    <Link
      title={isEnable ? disableTitle : enableTitle}
      style={{ opacity: isEnable ? 1 : 0.4 }}
      to={href}
      replace={true}
      className="button iconSwitch"
      preventScrollReset={true}
      ref={ref}
      {...props}
    >
      {children}
    </Link>
  );
});

export function AddButton({
  addTitle = "追加する",
  onClick,
}: {
  addTitle?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      title={addTitle}
      type="button"
      className="iconSwitch"
      onClick={onClick}
    >
      <AiOutlinePlus />
    </button>
  );
}

export function MoveButton({
  title = "移動する",
  onClick,
}: {
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      title={title}
      type="button"
      className="iconSwitch"
      onClick={onClick}
    >
      <TbArrowsMove />
    </button>
  );
}

export function CompleteButton({
  title = "完了する",
  onClick,
}: {
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      title={title}
      type="button"
      className="iconSwitch"
      onClick={onClick}
    >
      <MdDoneOutline />
    </button>
  );
}

export function CancelButton({
  title = "中止する",
  onClick,
}: {
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      title={title}
      type="button"
      className="iconSwitch"
      onClick={onClick}
    >
      <MdClose />
    </button>
  );
}
