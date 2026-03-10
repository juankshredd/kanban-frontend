"use client";

import { Task } from "@/types/task";
import TaskCard from "./TaskCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import CreateTaskModal from "./CreateTaskModal";

interface Props {
  title: "TODO" | "IN_PROGRESS" | "DONE";
  tasks: Task[];
  onDelete: (id: string) => void;
  refreshTasks: () => void;
}

export default function Column({ title, tasks, onDelete, refreshTasks }: Props) {

  const { setNodeRef } = useDroppable({
    id: title,
  });

  const [open, setOpen] = useState(false);

  return (
    <div ref={setNodeRef} className="kanban-column">

      <div className="flex justify-between items-center mb-3">
        <h2 className="column-title">{title}</h2>

        {/* botón crear */}
        <button
          onClick={() => setOpen(true)}
          className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
        >
          + New
        </button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDelete}
          />
        ))}
      </SortableContext>

      {open && (
        <CreateTaskModal
          status={title}
          close={() => setOpen(false)}
          refresh={refreshTasks}
        />
      )}

    </div>
  );
}