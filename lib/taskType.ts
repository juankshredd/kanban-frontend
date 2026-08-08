import { TaskType } from "@/types/task";

export const TASK_TYPES: TaskType[] = ["EPIC", "STORY", "TASK", "BUG"];

export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; badgeClass: string }
> = {
  EPIC: {
    label: "Epic",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
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
