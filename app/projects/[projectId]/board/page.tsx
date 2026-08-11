"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";

import Column from "@/components/kanban/Column";
import TaskCard from "@/components/kanban/TaskCard";
import { Task, TaskType } from "@/types/task";
import { ProjectDetail } from "@/types/project";
import { api } from "@/lib/api";

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchProject = async () => {
    const data = await api(`/projects/${projectId}`, "GET");
    setProject(data);
  };

  const fetchTasks = async () => {
    const data = await api(`/projects/${projectId}/tasks`, "GET");
    setTasks(data);
  };

  useEffect(() => {
    localStorage.setItem("activeProjectId", projectId);
    fetchProject();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleDeleteTask = async (id: string) => {
    await api(`/projects/${projectId}/tasks/${id}`, "DELETE");
    fetchTasks();
  };

  const handleTypeChange = async (id: string, type: TaskType) => {
    // Optimistic update: update UI immediately
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, type } : t))
    );

    // API call in background
    try {
      await api(`/projects/${projectId}/tasks/${id}`, "PATCH", { type });
    } catch {
      // Revert on error
      fetchTasks();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {

    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as "TODO" | "IN_PROGRESS" | "DONE";

    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic update: update UI immediately
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    // API call in background
    try {
      await api(`/projects/${projectId}/tasks/${taskId}`, "PATCH", {
        status: newStatus,
      });
    } catch {
      // Revert on error
      fetchTasks();
    }
  };

  const todo = tasks.filter((t) => t.status === "TODO");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={() => router.push("/projects")}
            className="text-slate-400 hover:text-slate-200 text-sm mb-2 transition"
          >
            ← Projects
          </button>
          <h1 className="text-3xl font-bold">
            {project ? (
              <>
                <span className="text-blue-400 font-mono mr-2">{project.key}</span>
                {project.name}
              </>
            ) : (
              "Loading..."
            )}
          </h1>
        </div>

        <button
          onClick={() => router.push(`/projects/${projectId}/members`)}
          className="border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold px-4 py-2 rounded-lg transition"
        >
          Members
        </button>
      </div>

      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >

        <div className="grid grid-cols-3 gap-6">

          <Column
            title="TODO"
            tasks={todo}
            projectId={projectId}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

          <Column
            title="IN_PROGRESS"
            tasks={inProgress}
            projectId={projectId}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

          <Column
            title="DONE"
            tasks={done}
            projectId={projectId}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 opacity-90">
              <TaskCard
                task={activeTask}
                onDelete={() => {}}
                onTypeChange={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>

    </div>
  );
}
