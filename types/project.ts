export type ProjectRole = "OWNER" | "MEMBER";

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  role: ProjectRole;
  task_count: number;
  member_count: number;
  company_id: string;
  company_name: string;
}

export interface ProjectMember {
  id: string;
  username: string;
  email: string;
  role: ProjectRole;
  joined_at: string;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}
