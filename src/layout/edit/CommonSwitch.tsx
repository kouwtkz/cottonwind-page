import { CreateStateFunctionType } from "@/state/CreateState";
import { AiFillEdit, AiOutlinePlus } from "react-icons/ai";
import { MdClose, MdDoneOutline } from "react-icons/md";
import { TbArrowsMove } from "react-icons/tb";

export function EditModeSwitch({
  editTitle = "編集モードにする",
  useSwitch,
}: {
  editTitle?: string;
  useSwitch: CreateStateFunctionType<boolean>;
}) {
  const [isEditHold, setIsEditHold] = useSwitch();
  return (
    <button
      title={isEditHold ? "元に戻す" : editTitle}
      type="button"
      className="iconSwitch"
      onClick={() => {
        setIsEditHold(!isEditHold);
      }}
      style={{ opacity: isEditHold ? 1 : 0.4 }}
    >
      <AiFillEdit />
    </button>
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