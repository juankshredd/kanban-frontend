"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ProjectDetail } from "@/types/project";

interface ProjectContextType {
  project: ProjectDetail | null;
  loading: boolean;
  notFound: boolean;
  error: string;
  refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const refreshProject = async () => {
    try {
      const data = await api(`/projects/${projectId}`, "GET");
      setProject(data);
      setNotFound(false);
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "No se pudo cargar el proyecto");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setError("");
    refreshProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <ProjectContext.Provider value={{ project, loading, notFound, error, refreshProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
