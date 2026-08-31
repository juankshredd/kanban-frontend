"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Task, TaskStatus } from "@/types/task";
import { getChildTypes, TASK_STATUSES } from "@/lib/taskType";

interface Props {
  parentTask: Task;
  childTasks: Task[];
  projectId: string;
  refresh: () => void;
  quickAddRef?: React.RefObject<HTMLInputElement | null>;
}

export default function ChildIssuesList({ parentTask, childTasks, projectId, refresh, quickAddRef }: Props) {
  const [orderIds, setOrderIds] = useState<string[]>(() => childTasks.map((c) => c.id));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [error, setError] = useState("");

  const childrenKey = childTasks.map((c) => c.id).join(",");

  useEffect(() => {
    setOrderIds(childTasks.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenKey]);

  const orderedChildren = orderIds
    .map((id) => childTasks.find((c) => c.id === id))
    .filter((c): c is Task => Boolean(c));

  const done = childTasks.filter((c) => c.status === "DONE").length;
  const total = childTasks.length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleAddChild = async () => {
    const title = draftTitle.trim();
    if (!title || submittingAdd) return;

    setSubmittingAdd(true);
    setError("");

    try {
      await api(`/projects/${projectId}/tasks`, "POST", {
        title,
        type: getChildTypes(parentTask.type)[0],
        parent_id: parentTask.id,
      });
      setDraftTitle("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la subtarea");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleStatusChange = async (childId: string, status: TaskStatus) => {
    setError("");

    try {
      await api(`/projects/${projectId}/tasks/${childId}`, "PATCH", { status });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el status");
    }
  };

  const handleUnlink = async (childId: string) => {
    setError("");

    try {
      await api(`/projects/${projectId}/tasks/${childId}`, "PATCH", { parent_id: null });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo quitar la subtarea");
    }
  };

  const handleDragStart = (index: number) => {
    dragStartIndexRef.current = index;
    setDragFrom(index);
    setDragOver(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOver !== index) setDragOver(index);
    if (dragFrom === null || dragFrom === index) return;

    setOrderIds((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(dragFrom, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragFrom(index);
  };

  const handleDragFinish = async () => {
    const finalIndex = dragFrom;
    const startIndex = dragStartIndexRef.current;
    setDragFrom(null);
    setDragOver(null);
    dragStartIndexRef.current = null;

    if (finalIndex === null || finalIndex === startIndex) return;

    const draggedId = orderIds[finalIndex];
    const afterTaskId = finalIndex > 0 ? orderIds[finalIndex - 1] : null;

    setError("");

    try {
      await api(`/projects/${projectId}/tasks/${draggedId}`, "PATCH", { after_task_id: afterTaskId });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo reordenar");
      // Roll back the optimistic local reorder explicitly: if the server's
      // order didn't actually change, childrenKey (childTasks ids joined in
      // order) is identical before and after this failed attempt, so the
      // resync effect below won't re-fire on its own to undo the drag.
      setOrderIds(childTasks.map((c) => c.id));
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Child issues
        </div>
        <div className="flex-1 max-w-[220px] h-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-xs text-slate-400">
          {done} of {total} done
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="border border-slate-700 rounded-lg overflow-hidden">
        {orderedChildren.map((child, index) => (
          <div
            key={child.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragFinish}
            onDrop={handleDragFinish}
            className={`grid grid-cols-[16px_74px_minmax(0,1fr)_132px_28px] items-center gap-2 px-3 py-2 cursor-grab hover:bg-slate-800/60 ${
              index > 0 ? "border-t border-slate-700" : ""
            } ${dragFrom === index ? "opacity-45" : ""} ${
              dragOver === index && dragFrom !== index ? "bg-blue-500/10" : ""
            }`}
          >
            <span className="text-slate-500 select-none" aria-hidden>⠿</span>
            <span className="font-mono text-[11px] text-blue-400 tracking-wide">
              {child.ticket_id}
            </span>
            <span
              className={`text-sm truncate ${
                child.status === "DONE" ? "text-slate-500 line-through" : "text-white"
              }`}
            >
              {child.title}
            </span>
            <select
              value={child.status}
              onChange={(e) => handleStatusChange(child.id, e.target.value as TaskStatus)}
              className="bg-slate-950 border border-slate-700 text-white text-[11px] rounded px-2 py-1"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleUnlink(child.id)}
              aria-label={`Remove ${child.ticket_id}`}
              className="w-6 h-6 grid place-items-center rounded text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        ))}

        <div
          className={`grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 ${
            total > 0 ? "border-t border-slate-700" : ""
          }`}
        >
          <span className="text-slate-500" aria-hidden>+</span>
          <input
            ref={quickAddRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddChild();
              }
            }}
            disabled={submittingAdd}
            placeholder="What needs to be done? Press Enter to add"
            className="bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleAddChild}
            disabled={submittingAdd}
            className="px-2.5 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
