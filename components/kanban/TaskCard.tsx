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
      className="task-card"
    >

      {/* drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mb-2"
      >
        <h3 className="task-title">
          {task.title}
        </h3>
      </div>

      <p className="task-desc">
        {task.description}
      </p>

      {task.status === "TODO" && (
        <div className="task-actions">
          <button
            onClick={handleDelete}
            className="text-red-500 dark:text-red-400 text-sm hover:text-red-700 dark:hover:text-red-300 transition"
          >
            Delete
          </button>
        </div>
      )}

    </div>
  );
}