import { CreateStateFunctionType } from "@src/state/CreateState";
import { HTMLAttributes, useMemo } from "react";
import { AiOutlinePlus, AiOutlineTool } from "react-icons/ai";
import { MdClose, MdDoneOutline } from "react-icons/md";
import { TbArrowsMove } from "react-icons/tb";
import { Link, useLocation, useSearchParams } from "react-router-dom";

interface ModeSwitchProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> {
  toEnableTitle?: string;
  toDisableTitle?: string;
  beforeOnClick?: (
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => boolean;
  useSwitch: CreateStateFunctionType<boolean>;
  ref?: React.RefObject<HTMLButtonElement>;
}
export function ModeSwitch({
  toEnableTitle = "有効にする",
  toDisableTitle = "元に戻す",
  children = <AiOutlineTool />,
  useSwitch,
  beforeOnClick,
  ref,
  ...props
}: ModeSwitchProps) {
  const [isEnable, setIsEnable] = useSwitch();
  return (
    <button
      title={isEnable ? toDisableTitle : toEnableTitle}
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

interface ModeSearchSwitchProps
  extends Omit<HTMLAttributes<HTMLAnchorElement>, "onClick"> {
  toEnableTitle?: string;
  toDisableTitle?: string;
  searchKey: string;
  ref?: React.RefObject<HTMLAnchorElement>;
}
export function ModeSearchSwitch({
  toEnableTitle = "有効にする",
  toDisableTitle = "元に戻す",
  children = <AiOutlineTool />,
  searchKey,
  ref,
  ...props
}: ModeSearchSwitchProps) {
  const searchParams = useSearchParams()[0];
  const { state } = useLocation();
  const [isEnable, href] = useMemo(() => {
    const has = searchParams.has(searchKey);
    if (has) searchParams.delete(searchKey);
    else searchParams.set(searchKey, "on");
    return [has, searchParams.size ? "?" + searchParams.toString() : ""];
  }, [searchKey, searchParams]);
  return (
    <Link
      title={isEnable ? toDisableTitle : toEnableTitle}
      style={{ opacity: isEnable ? 1 : 0.4 }}
      to={href}
      replace={true}
      className="button iconSwitch"
      preventScrollReset={true}
      ref={ref}
      state={state}
      {...props}
    >
      {children}
    </Link>
  );
}

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
