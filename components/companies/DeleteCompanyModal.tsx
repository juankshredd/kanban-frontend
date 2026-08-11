"use client";

interface Props {
  projectCount: number;
  confirming: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteCompanyModal({ projectCount, confirming, error, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-slate-900 border border-red-500/30 rounded-xl p-6 w-[420px]">

        <h2 className="text-xl font-bold mb-3 text-white">Delete company</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <p className="text-slate-300 text-sm mb-4">
          Esta company tiene <span className="font-semibold text-white">{projectCount}</span>{" "}
          {projectCount === 1 ? "proyecto" : "proyectos"}. Borrarla va a borrar en cascada{" "}
          {projectCount === 1 ? "ese proyecto" : "esos proyectos"} y todo lo que contienen
          (tareas, sprints, miembros). Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-2">

          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={confirming}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {confirming ? "Deleting..." : "Delete company and its projects"}
          </button>

        </div>

      </div>

    </div>
  );
}
