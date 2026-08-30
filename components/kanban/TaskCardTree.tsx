"use client";

import { Task, TaskType } from "@/types/task";
import { TaskNode } from "@/lib/taskHierarchy";
import TaskCard from "./TaskCard";

interface Props {
  node: TaskNode;
  depth: number;
  projectId: string;
  tasks: Task[];
  onDelete: (id: string) => void;
  onTypeChange: (id: string, type: TaskType) => void;
  refresh: () => void;
}

export default function TaskCardTree({ node, depth, projectId, tasks, onDelete, onTypeChange, refresh }: Props) {
  return (
    <TaskCard
      task={node.task}
      projectId={projectId}
      tasks={tasks}
      onDelete={onDelete}
      onTypeChange={onTypeChange}
      refresh={refresh}
      compact={depth > 0}
    >
      {node.children.map((child) => (
        <TaskCardTree
          key={child.task.id}
          node={child}
          depth={depth + 1}
          projectId={projectId}
          tasks={tasks}
          onDelete={onDelete}
          onTypeChange={onTypeChange}
          refresh={refresh}
        />
      ))}
    </TaskCard>
  );
}
