"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Project } from "@/types/project";
import { Company } from "@/types/company";
import ProjectCard from "@/components/projects/ProjectCard";

export default function ProjectsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [autoNavigateDone, setAutoNavigateDone] = useState(false);

  const fetchProjects = async (companyId: string) => {
    const query = companyId ? `?company_id=${companyId}` : "";
    const data = await api(`/projects${query}`, "GET");
    setProjects(data);
  };

  const fetchCompanies = async () => {
    const data = await api("/companies", "GET");
    setCompanies(data);
  };

  useEffect(() => {
    fetchProjects(companyFilter);
  }, [companyFilter]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const goToBoard = (project: Project) => {
    localStorage.setItem("activeProjectId", project.id);
    router.push(`/projects/${project.id}/board`);
  };

  // Only auto-jump into the board on the very first (unfiltered) load —
  // otherwise picking a company filter that narrows results to one
  // project would yank the user straight into its board.
  useEffect(() => {
    if (autoNavigateDone || !projects) return;

    setAutoNavigateDone(true);

    if (companyFilter === "" && projects.length === 1) {
      goToBoard(projects[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  if (projects === null || (!autoNavigateDone && companyFilter === "" && projects.length === 1)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="mb-8">
        <button
          onClick={() => router.push("/companies")}
          className="text-slate-400 hover:text-slate-200 text-sm mb-2 transition"
        >
          Companies →
        </button>

        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Your Projects</h1>

          <div className="flex items-center gap-3">
            {companies.length > 0 && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => router.push("/companies")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + New project
            </button>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-2xl py-24">
          <h2 className="text-xl font-semibold text-white mb-2">
            {companyFilter ? "No tenés proyectos en esta company todavía" : "No tenés proyectos todavía"}
          </h2>
          <p className="text-slate-400 mb-6 max-w-sm">
            Los proyectos viven dentro de una company. Elegí o creá una company
            para empezar a organizar tareas en un board.
          </p>
          <button
            onClick={() => router.push("/companies")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg transition"
          >
            Ir a Companies
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onSelect={goToBoard} />
          ))}
        </div>
      )}

    </div>
  );
}
