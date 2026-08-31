import { Task } from "@/types/task";

export interface TaskNode {
  task: Task;
  children: TaskNode[];
}

// Groups an already status-filtered column task list into a tree by
// parent_id. A task only nests under its parent if that parent is also
// present in `columnTasks` — if the parent is in a different column, the
// task renders as its own root node instead (see lib/taskHierarchy.ts
// callers: Column.tsx renders one column's tasks at a time).
export function buildTaskTree(columnTasks: Task[]): TaskNode[] {
  const nodesById = new Map<string, TaskNode>(
    columnTasks.map((task) => [task.id, { task, children: [] }])
  );

  const roots: TaskNode[] = [];

  for (const node of nodesById.values()) {
    const parentNode = node.task.parent_id
      ? nodesById.get(node.task.parent_id)
      : undefined;

    if (parentNode && parentNode !== node) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// All direct children of a task, regardless of column/status — unlike
// buildTaskTree, this is not scoped to a single column's task list.
export function getDirectChildren(tasks: Task[], parentId: string): Task[] {
  return tasks.filter((t) => t.parent_id === parentId);
}
