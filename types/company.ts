export type CompanyRole = "OWNER" | "MEMBER";

export interface Company {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  role: CompanyRole;
  project_count: number;
  member_count: number;
}

export interface CompanyMember {
  id: string;
  username: string;
  email: string;
  role: CompanyRole;
  joined_at: string;
}

export interface CompanyDetail extends Company {
  members: CompanyMember[];
}
