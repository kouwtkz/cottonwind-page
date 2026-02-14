import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS as dndCSS } from "@dnd-kit/utilities";
import type { RefObject } from "@fullcalendar/core/preact.js";

type InnerElement<T> = (props: { item: T; move?: boolean }) => React.ReactNode;
export function Movable<T>({
  items: argsItems,
  Inner,
  key = "id",
  submit,
  onSubmit,
  refItems,
}: {
  items: T[];
  Inner: InnerElement<T>;
  key?: UniqueIdentifier;
  submit?: boolean;
  onSubmit?: (items: T[]) => unknown;
  refItems?: React.Ref<T[]>;
}) {
  const inRefItems = useRef<T[]>(argsItems);
  useImperativeHandle(refItems, () => inRefItems.current);
  const [items, setItems] = useState<any[]>(argsItems);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) {
        return;
      }
      if (active.id !== over.id) {
        const oldIndex = items.findIndex((v) => v[key] === active.id);
        const newIndex = items.findIndex((v) => v[key] === over.id);
        const moved = arrayMove(items, oldIndex, newIndex);
        setItems(moved);
        inRefItems.current = moved;
      }
    },
    [items],
  );
  useEffect(() => {
    if (submit && onSubmit) onSubmit(inRefItems.current);
  }, [submit, onSubmit]);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {items.map((item) => {
          const id = item[key] as UniqueIdentifier;
          return (
            <SortableItem key={id} sortId={id}>
              <Inner item={item as T} move={true} />
            </SortableItem>
          );
        })}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  children,
  sortId,
}: {
  children?: ReactNode;
  sortId: UniqueIdentifier;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: sortId });
  const style: CSSProperties = {
    listStyle: "none",
    transform: dndCSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      className={"item move"}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </li>
  );
}
