"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Task, TaskStatus } from "@/types/task";
import { TASK_TYPE_CONFIG, TASK_PARENT_TYPE, getParentCandidates, getChildTypes, canGainParent } from "@/lib/taskType";
import { TASK_DETAIL_FIELDS } from "@/lib/taskDetails";
import { getDirectChildren } from "@/lib/taskHierarchy";
import CreateRelatedTaskModal from "./CreateRelatedTaskModal";
import ChildIssuesList from "./ChildIssuesList";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

interface Props {
  task: Task;
  projectId: string;
  tasks: Task[];
  close: () => void;
  refresh: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function TaskDetailsModal({ task, projectId, tasks, close, refresh }: Props) {
  const fields = TASK_DETAIL_FIELDS[task.type];
  const requiredParentType = TASK_PARENT_TYPE[task.type];
  const candidates = requiredParentType ? getParentCandidates(tasks, task.type) : [];
  const childTypes = getChildTypes(task.type);
  const canAddParent = canGainParent(task);
  const children = getDirectChildren(tasks, task.id);
  const typeConfig = TASK_TYPE_CONFIG[task.type];
  const parentTicketId = task.parent_id
    ? tasks.find((t) => t.id === task.parent_id)?.ticket_id
    : undefined;

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, task.details?.[f.key] ?? ""]))
  );
  const [parentId, setParentId] = useState(task.parent_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [addRelationOpen, setAddRelationOpen] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);

  // Resync when the underlying task's parent_id changes from outside this
  // modal — e.g. CreateRelatedTaskModal (opened from here) links a new
  // parent and calls refresh(), which updates the `task` prop while this
  // modal stays mounted. Without this, `parentId` state would stay at its
  // stale initial value and a subsequent Save would silently overwrite the
  // link that was just created.
  useEffect(() => {
    setParentId(task.parent_id ?? "");
  }, [task.parent_id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      await api(`/projects/${projectId}/tasks/${task.id}`, "PATCH", {
        details: values,
        ...(requiredParentType ? { parent_id: parentId || null } : {}),
      });
      refresh();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los detalles");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    setError("");

    try {
      await api(`/projects/${projectId}/tasks/${task.id}`, "PATCH", { status });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el status");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-[1240px] max-w-full max-h-[90vh] flex flex-col">

        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
            {task.project_name && <span className="truncate">{task.project_name} Board</span>}
            {parentTicketId && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-blue-400">{parentTicketId}</span>
              </>
            )}
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{task.ticket_id}</span>
          </div>
          <div className="flex-1" />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeConfig.badgeClass}`}>
            {typeConfig.label}
          </span>
          <button
            onClick={close}
            aria-label="Close"
            className="w-7 h-7 grid place-items-center rounded border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_372px] overflow-y-auto">

          <div className="p-6 flex flex-col gap-6 min-w-0">

            <div className="flex flex-col gap-2.5">
              <h1 className="text-2xl font-medium text-white m-0">{task.title}</h1>
              <div className="flex flex-wrap gap-1.5">
                {canAddParent && (
                  <button
                    onClick={() => setAddRelationOpen(true)}
                    className="h-[30px] px-3 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                  >
                    + Add related card
                  </button>
                )}
                {childTypes.length > 0 && (
                  <button
                    onClick={() => quickAddRef.current?.focus()}
                    className="h-[30px] px-3 text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg transition"
                  >
                    Create subtask
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {task.description && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </div>
                <p className="text-sm leading-relaxed text-slate-300 max-w-[68ch] m-0">
                  {task.description}
                </p>
              </div>
            )}

            {fields.length > 0 && (
              <div className="flex flex-col gap-3">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {field.label}
                    </label>
                    <textarea
                      value={values[field.key]}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      rows={3}
                      className="bg-slate-950 border border-slate-700 text-white placeholder-slate-500 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            )}

            {childTypes.length > 0 && (
              <ChildIssuesList
                parentTask={task}
                childTasks={children}
                projectId={projectId}
                refresh={refresh}
                quickAddRef={quickAddRef}
              />
            )}
          </div>

          <div className="p-6 border-l border-slate-800 flex flex-col gap-3.5">

            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              className="h-[34px] w-[168px] bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-700">
                Details
              </div>
              <div className="p-3 grid grid-cols-[96px_minmax(0,1fr)] gap-y-2.5 gap-x-3 items-center text-sm">

                {requiredParentType && (
                  <>
                    <span className="text-xs text-slate-400">Parent</span>
                    {candidates.length === 0 ? (
                      <p className="text-xs text-slate-500 m-0">
                        No {TASK_TYPE_CONFIG[requiredParentType].label} tasks available yet.
                      </p>
                    ) : (
                      <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="h-8 bg-slate-950 border border-slate-700 text-white text-xs rounded px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No parent</option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.ticket_id} — {c.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                )}

                <span className="text-xs text-slate-400">Type</span>
                <span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeConfig.badgeClass}`}>
                    {typeConfig.label}
                  </span>
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              Created {formatDate(task.created_at)}
              <br />
              Updated {formatDate(task.updated_at)}
            </div>

            <div className="flex-1" />

            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                disabled={saving}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>

              {(fields.length > 0 || requiredParentType) && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      {addRelationOpen && (
        <CreateRelatedTaskModal
          sourceTask={task}
          projectId={projectId}
          close={() => setAddRelationOpen(false)}
          refresh={refresh}
        />
      )}

    </div>
  );
}
