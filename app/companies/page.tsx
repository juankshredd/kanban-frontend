"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Company } from "@/types/company";
import CompanyCard from "@/components/companies/CompanyCard";
import CreateCompanyModal from "@/components/companies/CreateCompanyModal";

export default function CompaniesPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchCompanies = async () => {
    const data = await api("/companies", "GET");
    setCompanies(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only fetch, no dep to key off
    fetchCompanies();
  }, []);

  const goToCompany = (company: Company) => {
    router.push(`/companies/${company.id}`);
  };

  if (companies === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="mb-8">
        <button
          onClick={() => router.push("/projects")}
          className="text-slate-400 hover:text-slate-200 text-sm mb-2 transition"
        >
          ← Projects
        </button>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Your Companies</h1>

          {companies.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + New company
            </button>
          )}
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-2xl py-24">
          <h2 className="text-xl font-semibold text-white mb-2">
            No tenés companies todavía
          </h2>
          <p className="text-slate-400 mb-6 max-w-sm">
            Creá tu primera company para agrupar proyectos y gestionar sus miembros.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-3 rounded-lg transition"
          >
            Crear tu primera company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} onSelect={goToCompany} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCompanyModal
          close={() => setShowCreate(false)}
          onCreated={goToCompany}
        />
      )}

    </div>
  );
}
