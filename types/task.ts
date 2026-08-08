export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskType = "EPIC" | "STORY" | "TASK" | "BUG";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
}