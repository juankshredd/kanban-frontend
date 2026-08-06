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
      id={task.id}
      ref={setNodeRef}
      style={style}
      className="bg-slate-800 rounded-lg p-4 mb-3 shadow-md"
    >

      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mb-1"
      >
        <h3 className="text-white font-semibold">
          {task.title}
        </h3>
      </div>

      <p className="text-sm text-slate-400 mb-2">
        {task.description}
      </p>

      {task.status === "TODO" && (
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="text-red-400 text-sm hover:text-red-300 transition"
          >
            Delete
          </button>
        </div>
      )}

    </div>
  );
}