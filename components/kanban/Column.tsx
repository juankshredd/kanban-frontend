"use client";

import { Task, TaskType } from "@/types/task";
import TaskCard from "./TaskCard";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import CreateTaskModal from "./CreateTaskModal";

interface Props {
  title: "TODO" | "IN_PROGRESS" | "DONE";
  tasks: Task[];
  projectId: string;
  onDelete: (id: string) => void;
  onTypeChange: (id: string, type: TaskType) => void;
  refreshTasks: () => void;
}

export default function Column({ title, tasks, projectId, onDelete, onTypeChange, refreshTasks }: Props) {

  const { setNodeRef } = useDroppable({
    id: title,
  });

  const [open, setOpen] = useState(false);

  const canCreate = title === "TODO";

  return (
    <div ref={setNodeRef} className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[500px]">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-bold text-sm tracking-wide">{title}</h2>

        {canCreate && (
          <button
            onClick={() => setOpen(true)}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg transition"
          >
            + New
          </button>
        )}
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectId={projectId}
            onDelete={onDelete}
            onTypeChange={onTypeChange}
            refresh={refreshTasks}
          />
        ))}
      </SortableContext>

      {canCreate && open && (
        <CreateTaskModal
          projectId={projectId}
          close={() => setOpen(false)}
          refresh={refreshTasks}
        />
      )}

    </div>
  );
}