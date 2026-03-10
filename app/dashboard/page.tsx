"use client";

import {
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Column from "@/components/kanban/Column";
import Button from "@/components/ui/Button";
import { Task } from "@/types/task";

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Kanban Dashboard
        </h1>
        <Button
          onClick={handleLogout}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          Log Out
        </Button>
      </div>

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