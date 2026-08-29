import { Task, TaskType } from "@/types/task";

export const TASK_TYPES: TaskType[] = ["EPIC", "FEATURE", "STORY", "TASK", "BUG"];

export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; badgeClass: string }
> = {
  EPIC: {
    label: "Epic",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  FEATURE: {
    label: "Feature",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  STORY: {
    label: "Story",
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  TASK: {
    label: "Task",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  BUG: {
    label: "Bug",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

// Mirrors TASK_PARENT_TYPE in kanban-backend/src/controllers/taskController.js —
// keep both in sync when a type or its allowed parent changes.
export const TASK_PARENT_TYPE: Record<TaskType, TaskType | null> = {
  EPIC: null,
  FEATURE: "EPIC",
  STORY: "FEATURE",
  TASK: "STORY",
  BUG: "STORY",
};

export function getParentCandidates(tasks: Task[], childType: TaskType): Task[] {
  const requiredType = TASK_PARENT_TYPE[childType];
  if (!requiredType) return [];
  return tasks.filter((t) => t.type === requiredType);
}
