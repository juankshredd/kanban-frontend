"use client";

import { Project } from "@/types/project";

interface Props {
  project: Project;
  onSelect: (project: Project) => void;
}

export default function ProjectCard({ project, onSelect }: Props) {

  const roleBadgeClass =
    project.role === "OWNER"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-slate-500/15 text-slate-300 border-slate-500/30";

  return (
    <button
      onClick={() => onSelect(project)}
      className="text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-bold text-blue-400 tracking-wide">
          {project.key}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass}`}>
          {project.role}
        </span>
      </div>

      <h3 className="text-white font-semibold mb-1">{project.name}</h3>

      {project.company_name && (
        <p className="text-xs text-slate-500 mb-2">{project.company_name}</p>
      )}

      {project.description && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex gap-4 text-xs text-slate-500">
        <span>{project.task_count} tasks</span>
        <span>{project.member_count} members</span>
      </div>
    </button>
  );
}
