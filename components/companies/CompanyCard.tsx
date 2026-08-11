"use client";

import { Company } from "@/types/company";

interface Props {
  company: Company;
  onSelect: (company: Company) => void;
}

export default function CompanyCard({ company, onSelect }: Props) {

  const roleBadgeClass =
    company.role === "OWNER"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-slate-500/15 text-slate-300 border-slate-500/30";

  return (
    <button
      onClick={() => onSelect(company)}
      className="text-left bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-5 transition"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadgeClass}`}>
          {company.role}
        </span>
      </div>

      <h3 className="text-white font-semibold mb-1">{company.name}</h3>

      {company.description && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {company.description}
        </p>
      )}

      <div className="flex gap-4 text-xs text-slate-500">
        <span>{company.project_count} projects</span>
        <span>{company.member_count} members</span>
      </div>
    </button>
  );
}
