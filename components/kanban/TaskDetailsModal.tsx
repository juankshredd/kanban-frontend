"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Task } from "@/types/task";
import { TASK_TYPE_CONFIG } from "@/lib/taskType";
import { TASK_DETAIL_FIELDS } from "@/lib/taskDetails";

interface Props {
  task: Task;
  projectId: string;
  close: () => void;
  refresh: () => void;
}

export default function TaskDetailsModal({ task, projectId, close, refresh }: Props) {
  const fields = TASK_DETAIL_FIELDS[task.type];

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, task.details?.[f.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      await api(`/projects/${projectId}/tasks/${task.id}`, "PATCH", { details: values });
      refresh();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los detalles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[28rem] max-h-[85vh] overflow-y-auto">

        <div className="mb-4">
          <span className="font-mono text-xs font-bold text-slate-400 tracking-wide">
            {task.ticket_id}
          </span>
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        {fields.length === 0 ? (
          <p className="text-slate-400 text-sm mb-4">
            Las tarjetas de tipo {TASK_TYPE_CONFIG[task.type].label} no tienen campos adicionales.
          </p>
        ) : (
          fields.map((field) => (
            <div key={field.key} className="mb-3">
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
          ))
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={close}
            disabled={saving}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>

          {fields.length > 0 && (
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
  );
}
