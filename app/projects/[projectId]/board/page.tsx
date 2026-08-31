"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";

import Column from "@/components/kanban/Column";
import TaskCard from "@/components/kanban/TaskCard";
import { Task, TaskType } from "@/types/task";
import { api } from "@/lib/api";

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    try {
      const data = await api(`/projects/${projectId}/tasks`, "GET");
      setTasks(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el tablero");
    }
  };

  useEffect(() => {
    localStorage.setItem("activeProjectId", projectId);
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleDeleteTask = async (id: string) => {
    try {
      await api(`/projects/${projectId}/tasks/${id}`, "DELETE");
      fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar la tarea");
    }
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
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-8">Board</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >

        <div className="grid grid-cols-3 gap-6">

          <Column
            title="TODO"
            tasks={todo}
            allTasks={tasks}
            projectId={projectId}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

          <Column
            title="IN_PROGRESS"
            tasks={inProgress}
            allTasks={tasks}
            projectId={projectId}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

          <Column
            title="DONE"
            tasks={done}
            allTasks={tasks}
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
                projectId={projectId}
                tasks={[]}
                onDelete={() => {}}
                onTypeChange={() => {}}
                refresh={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>

    </div>
  );
}
