export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskType = "EPIC" | "FEATURE" | "STORY" | "TASK" | "BUG";

export interface Task {
  id: string;
  ticket_id: string;
  ticket_number: number;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  project_id: string;
  parent_id: string | null;
  details: Record<string, string | null>;
  project_key?: string;
  project_name?: string;
  user_id: string;
  user_name?: string;
  created_at: string;
  updated_at: string;
}
