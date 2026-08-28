interface IconProps {
  className?: string;
}

function BoardIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  );
}

function MembersIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export interface ProjectNavItem {
  id: string;
  label: string;
  href: (projectId: string) => string;
  icon: (props: IconProps) => React.JSX.Element;
}

export interface ProjectNavSection {
  title: string;
  items: ProjectNavItem[];
}

// Single source of truth for the project sidebar. To add a new module:
// 1. Create app/projects/[projectId]/<module>/page.tsx (it renders inside
//    the shared layout automatically).
// 2. Add an entry here (new item in an existing section, or a new section).
// ProjectSidebar renders off this list, so no other file needs to change.
export const PROJECT_NAV_SECTIONS: ProjectNavSection[] = [
  {
    title: "WORK",
    items: [
      {
        id: "board",
        label: "Board",
        href: (projectId) => `/projects/${projectId}/board`,
        icon: BoardIcon,
      },
      {
        id: "members",
        label: "Members",
        href: (projectId) => `/projects/${projectId}/members`,
        icon: MembersIcon,
      },
    ],
  },
];
