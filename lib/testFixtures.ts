import { Task, TaskType } from "@/types/task";

let ticketCounter = 0;

export function makeTask(overrides: Partial<Task> & { type: TaskType }): Task {
  ticketCounter += 1;

  return {
    id: `task-${ticketCounter}`,
    ticket_id: `TCK-${ticketCounter}`,
    ticket_number: ticketCounter,
    title: `Task ${ticketCounter}`,
    description: "",
    status: "TODO",
    project_id: "project-1",
    parent_id: null,
    details: {},
    user_id: "user-1",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
