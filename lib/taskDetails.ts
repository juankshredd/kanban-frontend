import { TaskType } from "@/types/task";

export interface TaskDetailField {
  key: string;
  label: string;
}

// Mirrors TASK_DETAIL_FIELDS in kanban-backend/src/controllers/taskController.js —
// keep both in sync when a field or type is added.
export const TASK_DETAIL_FIELDS: Record<TaskType, TaskDetailField[]> = {
  EPIC: [],
  STORY: [{ key: "acceptance_criteria", label: "Acceptance Criteria" }],
  TASK: [],
  BUG: [
    { key: "steps_to_reproduce", label: "Steps to Reproduce" },
    { key: "expected_behavior", label: "Expected Behavior" },
    { key: "actual_behavior", label: "Actual Behavior" },
  ],
};
