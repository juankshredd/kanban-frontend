"use client";

import { useEffect, useState } from "react";
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

export default function Dashboard() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    const data = await api("/tasks", "GET");
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDeleteTask = async (id: string) => {
    await api(`/tasks/${id}`, "DELETE");
    fetchTasks();
  };

  const handleTypeChange = async (id: string, type: TaskType) => {
    // Optimistic update: update UI immediately
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, type } : t))
    );

    // API call in background
    try {
      await api(`/tasks/${id}/type`, "PATCH", { type });
    } catch (error) {
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
      await api(`/tasks/${taskId}`, "PATCH", {
        status: newStatus,
      });
    } catch (error) {
      // Revert on error
      fetchTasks();
    }
  };

  const todo = tasks.filter((t) => t.status === "TODO");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <h1 className="text-3xl font-bold mb-8">
        Kanban Dashboard
      </h1>

      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >

        <div className="grid grid-cols-3 gap-6">

          <Column
            title="TODO"
            tasks={todo}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

          <Column
            title="IN_PROGRESS"
            tasks={inProgress}
            onDelete={handleDeleteTask}
            onTypeChange={handleTypeChange}
            refreshTasks={fetchTasks}
          />

          <Column
            title="DONE"
            tasks={done}
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