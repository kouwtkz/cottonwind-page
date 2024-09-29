import { CreateStateFunctionType } from "@/state/CreateState";
import { ReactNode, useMemo } from "react";
import { AiOutlinePlus, AiOutlineTool } from "react-icons/ai";
import { MdClose, MdDoneOutline } from "react-icons/md";
import { TbArrowsMove } from "react-icons/tb";
import { Link, useSearchParams } from "react-router-dom";

export function ModeSwitch({
  enableTitle = "有効にする",
  disableTitle = "元に戻す",
  children = <AiOutlineTool />,
  useSwitch,
}: {
  enableTitle?: string;
  disableTitle?: string;
  children?: ReactNode;
  useSwitch: CreateStateFunctionType<boolean>;
}) {
  const [isEnable, setIsEnable] = useSwitch();
  return (
    <button
      title={isEnable ? disableTitle : enableTitle}
      type="button"
      className="iconSwitch"
      onClick={() => {
        setIsEnable(!isEnable);
      }}
      style={{ opacity: isEnable ? 1 : 0.4 }}
    >
      {children}
    </button>
  );
}

export function ModeSearchSwitch({
  enableTitle = "有効にする",
  disableTitle = "元に戻す",
  children = <AiOutlineTool />,
  searchKey,
}: {
  enableTitle?: string;
  disableTitle?: string;
  children?: ReactNode;
  searchKey: string;
}) {
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
    >
      {children}
    </Link>
  );
}

export function EditModeSearchSwitch() {}

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
