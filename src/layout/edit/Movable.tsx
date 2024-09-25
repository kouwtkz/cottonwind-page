import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
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
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS as dndCSS } from "@dnd-kit/utilities";

type InnerElement<T> = (props: { item: T; move?: boolean }) => JSX.Element;
export function Movable<T>({
  items: Items,
  Inner,
  key = "id",
  submit,
  onSubmit,
}: {
  items: T[];
  Inner: InnerElement<T>;
  key?: UniqueIdentifier;
  submit?: boolean;
  onSubmit?: (items: T[]) => unknown;
}) {
  const [items, setItems] = useState<any[]>(Items);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items]
  );
  useEffect(() => {
    if (submit && onSubmit) onSubmit(items);
  }, [submit, onSubmit, items]);
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
    <div
      className={"item move"}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
