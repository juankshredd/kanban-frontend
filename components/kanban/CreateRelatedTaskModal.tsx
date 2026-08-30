"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Task, TaskType } from "@/types/task";
import { TASK_TYPE_CONFIG, TASK_PARENT_TYPE, getChildTypes, canGainParent } from "@/lib/taskType";

type Relation = "CHILD" | "PARENT";

interface Props {
  sourceTask: Task;
  projectId: string;
  close: () => void;
  refresh: () => void;
}

export default function CreateRelatedTaskModal({ sourceTask, projectId, close, refresh }: Props) {
  const childTypes = getChildTypes(sourceTask.type);
  const parentType = TASK_PARENT_TYPE[sourceTask.type];

  const canAddChild = childTypes.length > 0;
  const canAddParent = canGainParent(sourceTask);

  const [relation, setRelation] = useState<Relation | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [childType, setChildType] = useState<TaskType | "">(childTypes[0] ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Set once the PARENT flow's create-task POST succeeds, so a retry after a
  // failed link PATCH only retries the link instead of creating a second,
  // duplicate parent task.
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);

  const handleBack = () => {
    setRelation(null);
    setTitle("");
    setDescription("");
    setChildType(childTypes[0] ?? "");
    setPendingParentId(null);
    setError("");
  };

  const handleCreate = async () => {
    if (!relation) return;

    setSaving(true);
    setError("");

    try {
      if (relation === "CHILD") {
        await api(`/projects/${projectId}/tasks`, "POST", {
          title,
          description,
          type: childType,
          parent_id: sourceTask.id,
        });
      } else {
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
          // Surface the new (still-unlinked) parent task immediately, in
          // case the link PATCH below fails and the user doesn't retry.
          refresh();
        }

        await api(`/projects/${projectId}/tasks/${sourceTask.id}`, "PATCH", {
          parent_id: newParentId,
        });
      }

      refresh();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la tarea relacionada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-96">

        <h2 className="text-xl font-bold mb-4 text-white">
          {relation === null
            ? "Add related card"
            : relation === "CHILD"
              ? "New child card"
              : "New parent card"}
        </h2>

        {relation === null && (
          <div className="flex flex-col gap-3 mb-3">
            <div>
              <button
                onClick={() => setRelation("CHILD")}
                disabled={!canAddChild}
                className="w-full px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
              >
                Child of this card
              </button>
              {!canAddChild && (
                <p className="text-xs text-slate-500 mt-1">
                  {TASK_TYPE_CONFIG[sourceTask.type].label} cards can&apos;t have children.
                </p>
              )}
            </div>

            <div>
              <button
                onClick={() => setRelation("PARENT")}
                disabled={!canAddParent}
                className="w-full px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
              >
                Parent of this card
              </button>
              {!canAddParent && (
                <p className="text-xs text-slate-500 mt-1">
                  {!parentType
                    ? `${TASK_TYPE_CONFIG[sourceTask.type].label} cards can't have a parent.`
                    : "This card already has a parent — edit the existing link instead."}
                </p>
              )}
            </div>
          </div>
        )}

        {relation !== null && (
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

            {relation === "CHILD" ? (
              <select
                value={childType}
                onChange={(e) => setChildType(e.target.value as TaskType)}
                className="bg-slate-950 border border-slate-700 text-white w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {childTypes.map((t) => (
                  <option key={t} value={t}>
                    {TASK_TYPE_CONFIG[t].label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-white bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 mb-3">
                {parentType ? TASK_TYPE_CONFIG[parentType].label : ""}
              </p>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">

          {relation !== null && (
            <button
              onClick={handleBack}
              disabled={saving}
              className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 mr-auto"
            >
              Back
            </button>
          )}

          <button
            onClick={close}
            disabled={saving}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>

          {relation !== null && (
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
