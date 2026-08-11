"use client";

import { useParams, useRouter } from "next/navigation";
import { ProjectProvider, useProject } from "@/context/ProjectProvider";
import ProjectSidebar from "@/components/layout/ProjectSidebar";

function ProjectShell({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const router = useRouter();
  const { notFound, error } = useProject();

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <p className="text-slate-400">No encontramos este proyecto, o no tenés acceso a él.</p>
        <button
          onClick={() => router.push("/projects")}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          ← Volver a proyectos
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      <ProjectSidebar projectId={projectId} />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectShell projectId={projectId}>{children}</ProjectShell>
    </ProjectProvider>
  );
}
