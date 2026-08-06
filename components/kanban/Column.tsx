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
    <div ref={setNodeRef} className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[500px]">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-sm tracking-wide">{title}</h2>

        <button
          onClick={() => setOpen(true)}
          className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg transition"
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