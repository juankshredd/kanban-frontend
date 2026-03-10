"use client";

import {
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Column from "@/components/kanban/Column";
import { Task } from "@/types/task";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const data = await api("/tasks");
    setTasks(data);
  };

  const handleDeleteTask = async (id: string) => {
    await api(`/tasks/${id}`, "DELETE");
    fetchTasks();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id as "TODO" | "IN_PROGRESS" | "DONE";

    await api(`/tasks/${taskId}`, "PATCH", {
      status: newStatus,
    });

    fetchTasks();
  };

  const todo = tasks.filter((t) => t.status === "TODO");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="min-h-screen bg-gray-200 p-8">

      <h1 className="text-3xl font-bold mb-6">
        Kanban Dashboard
      </h1>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">

          <Column
  title="TODO"
  tasks={todo}
  onDelete={handleDeleteTask}
  refreshTasks={fetchTasks}
/>

<Column
  title="IN_PROGRESS"
  tasks={inProgress}
  onDelete={handleDeleteTask}
  refreshTasks={fetchTasks}
/>

<Column
  title="DONE"
  tasks={done}
  onDelete={handleDeleteTask}
  refreshTasks={fetchTasks}
/>
        </div>
      </DndContext>

    </div>
  );
}