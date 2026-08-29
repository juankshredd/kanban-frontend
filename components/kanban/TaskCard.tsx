"use client";

import { useState } from "react";
import { Task, TaskType } from "@/types/task";
import { TASK_TYPES, TASK_TYPE_CONFIG } from "@/lib/taskType";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskDetailsModal from "./TaskDetailsModal";

interface Props {
  task: Task;
  projectId: string;
  tasks: Task[];
  onDelete: (id: string) => void;
  onTypeChange: (id: string, type: TaskType) => void;
  refresh: () => void;
}

export default function TaskCard({ task, projectId, tasks, onDelete, onTypeChange, refresh }: Props) {

  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const handleOpenDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailsOpen(true);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTypeChange(task.id, e.target.value as TaskType);
  };

  const typeConfig = TASK_TYPE_CONFIG[task.type];

  return (
    <div
      id={task.id}
      ref={setNodeRef}
      style={style}
      className="bg-slate-800 rounded-lg p-4 mb-3 shadow-md"
    >

      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-bold text-slate-400 tracking-wide">
          {task.ticket_id}
        </span>

        <select
          value={task.type}
          onChange={handleTypeChange}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 ${typeConfig.badgeClass}`}
        >
          {TASK_TYPES.map((t) => (
            <option key={t} value={t} className="bg-slate-800 text-white">
              {TASK_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>
      </div>

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

      <div className="flex gap-2">
        <button
          onClick={handleOpenDetails}
          className="text-blue-400 text-sm hover:text-blue-300 transition"
        >
          Details
        </button>

        {task.status === "TODO" && (
          <button
            onClick={handleDelete}
            className="text-red-400 text-sm hover:text-red-300 transition"
          >
            Delete
          </button>
        )}
      </div>

      {detailsOpen && (
        <TaskDetailsModal
          task={task}
          projectId={projectId}
          tasks={tasks}
          close={() => setDetailsOpen(false)}
          refresh={refresh}
        />
      )}

    </div>
  );
}