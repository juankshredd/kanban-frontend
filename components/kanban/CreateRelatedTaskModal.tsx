"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Task } from "@/types/task";
import { TASK_TYPE_CONFIG, TASK_PARENT_TYPE } from "@/lib/taskType";

interface Props {
  sourceTask: Task;
  projectId: string;
  close: () => void;
  refresh: () => void;
}

// Creates a new parent task and links sourceTask under it. Only meant to be
// mounted when canGainParent(sourceTask) is true — callers (TaskDetailsModal)
// are responsible for that check, since a task with no legal parent type, or
// one that already has a parent, has nothing for this modal to do.
export default function CreateRelatedTaskModal({ sourceTask, projectId, close, refresh }: Props) {
  const parentType = TASK_PARENT_TYPE[sourceTask.type];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Set once the create-task POST succeeds, so a retry after a failed link
  // PATCH only retries the link instead of creating a second, duplicate
  // parent task.
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

  const handleCreate = async () => {
    setSaving(true);
    setError("");

    try {
      let newParentId = pendingParentId;

      if (!newParentId) {
        const created = await api(`/projects/${projectId}/tasks`, "POST", {
          title,
          description,
          type: parentType,
        });

        if (!created?.id) {
          throw new Error("Unexpected response creating the parent task");
        }

        newParentId = created.id;
        setPendingParentId(newParentId);
      }

      await api(`/projects/${projectId}/tasks/${sourceTask.id}`, "PATCH", {
        parent_id: newParentId,
      });

      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la tarea relacionada");
    } finally {
      // Exactly one refresh per attempt, regardless of outcome: covers a
      // full success (create+link), and also the partial failure where the
      // create succeeded but the link PATCH didn't — surfacing that
      // still-unlinked task without racing a second, redundant refresh.
      refresh();
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-96">

        <h2 className="text-xl font-bold mb-4 text-white">
          New parent card
        </h2>

        {pendingParentId ? (
          <p className="text-sm text-slate-400 mb-3">
            A parent card was already created on a previous attempt — click Create to link it to this card.
          </p>
        ) : (
          <>
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

            <p className="text-white bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 mb-3">
              {parentType ? TASK_TYPE_CONFIG[parentType].label : ""}
            </p>
          </>
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
