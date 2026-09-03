"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProject } from "@/context/ProjectProvider";
import { PROJECT_NAV_SECTIONS } from "@/lib/projectNav";

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={collapsed ? "rotate-180" : ""}
    >
      <path d="M11 19l-7-7 7-7" />
      <path d="M18 19l-7-7 7-7" />
    </svg>
  );
}

interface Props {
  projectId: string;
}

// Matches Tailwind's default `lg` breakpoint (1024px) — below it (phones,
// and iPad mini in both orientations) the sidebar defaults to its icon-only
// rail so the board/content area isn't left with a sliver of usable width;
// the user can still expand it manually via the collapse toggle either way.
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktopQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getIsDesktop() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// SSR/first-paint snapshot assumes non-desktop, so phones and iPad mini (in
// either orientation) — every device this PR targets — render collapsed with
// no flash. A real desktop viewport briefly renders collapsed then expands
// once this store's live snapshot kicks in; that one-time flash only affects
// desktop, and favors a correct, flash-free result on the narrow devices
// this behavior exists for in the first place.
export default function ProjectSidebar({ projectId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { project, loading } = useProject();

  const isDesktop = useSyncExternalStore(subscribeToDesktopQuery, getIsDesktop, () => false);
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null);
  const collapsed = manualCollapsed ?? !isDesktop;

  return (
    <div
      className={`flex flex-col shrink-0 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 transition-all ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`px-4 pt-5 pb-4 border-b border-slate-800 ${collapsed ? "px-2" : ""}`}>
        {!collapsed && (
          <button
            onClick={() => router.push(project ? `/companies/${project.company_id}` : "/companies")}
            className="text-slate-400 hover:text-slate-200 text-xs mb-2 transition truncate block w-full text-left"
          >
            ← {project?.company_name || "Companies"}
          </button>
        )}

        {loading ? (
          <div className="h-5 bg-slate-800 rounded animate-pulse" />
        ) : project ? (
          collapsed ? (
            <div
              title={project.name}
              className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-300 font-mono text-xs font-bold flex items-center justify-center mx-auto"
            >
              {project.key.slice(0, 2)}
            </div>
          ) : (
            <div>
              <span className="font-mono text-xs font-bold text-blue-400 tracking-wide block mb-0.5">
                {project.key}
              </span>
              <h1 className="text-white font-semibold truncate" title={project.name}>
                {project.name}
              </h1>
            </div>
          )
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {PROJECT_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <div className="px-4 text-[11px] font-semibold text-slate-500 tracking-wider mb-1">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const href = item.href(projectId);
              const active = pathname?.startsWith(href);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(href)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm font-medium transition ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    active
                      ? "bg-blue-500/10 text-blue-300 border-r-2 border-blue-400"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={`border-t border-slate-800 p-2 ${collapsed ? "flex justify-center" : "flex justify-end"}`}>
        <button
          onClick={() => setManualCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>
    </div>
  );
}
