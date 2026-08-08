"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { TaskStatus, TaskType } from "@/types/task";
import { TASK_TYPES, TASK_TYPE_CONFIG } from "@/lib/taskType";

interface Props {
  status: TaskStatus;
  close: () => void;
  refresh: () => void;
}

export default function CreateTaskModal({ status, close, refresh }: Props) {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("STORY");

  const handleCreate = async () => {
    await api("/tasks", "POST", {
      title,
      description,
      status,
      type,
    });

    refresh();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-96">

        <h2 className="text-xl font-bold mb-4 text-white">
          Create Task
        </h2>

        <input
          placeholder="Title"
          className="bg-slate-950 border border-slate-700 text-white placeholder-slate-500 w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="bg-slate-950 border border-slate-700 text-white placeholder-slate-500 w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="block text-xs font-semibold text-slate-400 mb-1">
          Type
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value as TaskType)}
          className="bg-slate-950 border border-slate-700 text-white w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TASK_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">

          <button
            onClick={close}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  );
}