"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Project } from "@/types/project";

const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

interface Props {
  companyId: string;
  close: () => void;
  onCreated: (project: Project) => void;
}

export default function CreateProjectModal({ companyId, close, onCreated }: Props) {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    if (key && !KEY_PATTERN.test(key)) {
      setError("La key debe empezar con una letra y tener entre 2 y 10 caracteres (letras/números)");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const project = await api(`/companies/${companyId}/projects`, "POST", {
        name: name.trim(),
        description: description.trim() || undefined,
        key: key || undefined,
      });

      onCreated(project);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-96">

        <h2 className="text-xl font-bold mb-4 text-white">
          Create Project
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <input
          placeholder="Project name"
          className="bg-slate-950 border border-slate-700 text-white placeholder-slate-500 w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description (optional)"
          className="bg-slate-950 border border-slate-700 text-white placeholder-slate-500 w-full mb-3 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          placeholder="Key (optional, e.g. KAN)"
          maxLength={10}
          className="bg-slate-950 border border-slate-700 text-white placeholder-slate-500 w-full mb-1 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
        />

        <p className="text-xs text-slate-500 mb-3">
          Se genera sola a partir del nombre si la dejás vacía.
        </p>

        <div className="flex justify-end gap-2">

          <button
            onClick={close}
            className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {submitting ? "Creating..." : "Create"}
          </button>

        </div>

      </div>

    </div>
  );
}
