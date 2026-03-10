"use client";

import { Task } from "@/types/task";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  task: Task;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: Props) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-md p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition"
    >

      <h3 className="font-semibold">
        {task.title}
      </h3>

      <p className="text-sm text-gray-500">
        {task.description}
      </p>

      {task.status === "TODO" && (
        <button
          onClick={handleDelete}
          className="text-red-500 text-sm mt-3"
        >
          Delete
        </button>
      )}

    </div>
  );
}