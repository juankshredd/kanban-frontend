"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Task, TaskType } from "@/types/task";
import { TASK_TYPES, TASK_TYPE_CONFIG, TASK_PARENT_TYPE, getParentCandidates } from "@/lib/taskType";

interface Props {
  projectId: string;
  tasks: Task[];
  close: () => void;
  refresh: () => void;
}

export default function CreateTaskModal({ projectId, tasks, close, refresh }: Props) {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("STORY");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const requiredParentType = TASK_PARENT_TYPE[type];
  const candidates = getParentCandidates(tasks, type);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value as TaskType);
    setParentId("");
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");

    try {
      await api(`/projects/${projectId}/tasks`, "POST", {
        title,
        description,
        type,
        ...(parentId ? { parent_id: parentId } : {}),
      });

      refresh();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la tarea");
    } finally {
      setSaving(false);
    }
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
          onChange={handleTypeChange}
          className="bg-slate-950 border border-slate-700 text-white w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TASK_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        {requiredParentType && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Parent
            </label>

            {candidates.length === 0 ? (
              <p className="text-sm text-slate-500">
                No {TASK_TYPE_CONFIG[requiredParentType].label} tasks available yet — create one first.
              </p>
            ) : (
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No parent</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ticket_id} — {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">

          <button
            onClick={close}
            disabled={saving}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create"}
          </button>

        </div>

      </div>

    </div>
  );
}