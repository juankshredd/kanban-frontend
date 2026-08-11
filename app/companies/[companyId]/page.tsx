"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CompanyDetail, CompanyRole } from "@/types/company";
import { Project } from "@/types/project";
import ProjectCard from "@/components/projects/ProjectCard";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import DeleteCompanyModal from "@/components/companies/DeleteCompanyModal";

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CompanyRole>("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmForceCount, setConfirmForceCount] = useState<number | null>(null);

  const fetchCompany = async () => {
    try {
      const data = await api(`/companies/${companyId}`, "GET");
      setCompany(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof Error ? err.message : "No se pudo cargar la company");
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await api(`/companies/${companyId}/projects`, "GET");
      setProjects(data);
    } catch {
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const isOwner = company?.role === "OWNER";

  const goToProject = (project: Project) => {
    localStorage.setItem("activeProjectId", project.id);
    router.push(`/projects/${project.id}/board`);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError("El nombre es obligatorio");
      return;
    }

    if (editName.trim().length > 100) {
      setEditError("El nombre no puede superar los 100 caracteres");
      return;
    }

    setEditError("");
    setSavingEdit(true);

    try {
      const updated = await api(`/companies/${companyId}`, "PATCH", {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setCompany((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo actualizar la company");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("El email es obligatorio");
      return;
    }

    setInviteError("");
    setInviting(true);

    try {
      await api(`/companies/${companyId}/members`, "POST", {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setInviteEmail("");
      setInviteRole("MEMBER");
      fetchCompany();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "No se pudo invitar al usuario");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: CompanyRole) => {
    setActionError("");
    setActioningUserId(userId);

    try {
      await api(`/companies/${companyId}/members/${userId}`, "PATCH", { role });
      fetchCompany();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cambiar el rol");
    } finally {
      setActioningUserId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setActionError("");
    setActioningUserId(userId);

    try {
      await api(`/companies/${companyId}/members/${userId}`, "DELETE");
      fetchCompany();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo quitar al miembro");
    } finally {
      setActioningUserId(null);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    setDeleting(true);

    try {
      await api(`/companies/${companyId}`, "DELETE");
      router.push("/companies");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const data = err.data as { project_count?: number } | undefined;
        setConfirmForceCount(data?.project_count ?? 0);
      } else {
        setDeleteError(err instanceof Error ? err.message : "No se pudo borrar la company");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleForceDelete = async () => {
    setDeleteError("");
    setDeleting(true);

    try {
      await api(`/companies/${companyId}?force=true`, "DELETE");
      router.push("/companies");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo borrar la company");
    } finally {
      setDeleting(false);
      setConfirmForceCount(null);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <p className="text-slate-400">No encontramos esta company, o no tenés acceso a ella.</p>
        <button
          onClick={() => router.push("/companies")}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          ← Volver a companies
        </button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">{loadError || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="mb-8">
        <button
          onClick={() => router.push("/companies")}
          className="text-slate-400 hover:text-slate-200 text-sm mb-2 transition"
        >
          ← Companies
        </button>

        {editing ? (
          <div className="max-w-xl">
            {editError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
                {editError}
              </div>
            )}

            <input
              placeholder="Company name"
              maxLength={100}
              className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 w-full mb-2 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <textarea
              placeholder="Description (optional)"
              className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 w-full mb-3 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setEditError("");
                  setEditName(company.name);
                  setEditDescription(company.description || "");
                }}
                disabled={savingEdit}
                className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/30">
                  {company.role}
                </span>
              </div>
              {company.description && (
                <p className="text-slate-400 max-w-xl">{company.description}</p>
              )}
            </div>

            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold px-4 py-2 rounded-lg transition"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Members */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Members <span className="text-slate-500 font-normal">({company.members.length})</span>
          </h2>

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
              {actionError}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
            {company.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-b-0"
              >
                <div>
                  <div className="text-white font-semibold">{member.username}</div>
                  <div className="text-slate-400 text-sm">{member.email}</div>
                </div>

                {isOwner ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      disabled={actioningUserId === member.id}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as CompanyRole)}
                      className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="OWNER">OWNER</option>
                      <option value="MEMBER">MEMBER</option>
                    </select>

                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={actioningUserId === member.id}
                      className="text-red-400 text-sm hover:text-red-300 disabled:opacity-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-500/15 text-slate-300 border-slate-500/30">
                    {member.role}
                  </span>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Invite by email</h3>

              {inviteError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
                  {inviteError}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CompanyRole)}
                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="OWNER">OWNER</option>
                </select>

                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition"
                >
                  {inviting ? "Inviting..." : "Invite"}
                </button>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="mt-8 bg-slate-900 border border-red-500/20 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-1">Danger zone</h3>
              <p className="text-slate-400 text-sm mb-3">
                Borrar esta company es permanente.
              </p>

              {deleteError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
                  {deleteError}
                </div>
              )}

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 font-semibold px-4 py-2 rounded-lg transition"
              >
                {deleting ? "Deleting..." : "Delete company"}
              </button>
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">
              Your projects here <span className="text-slate-500 font-normal">({projects?.length ?? 0})</span>
            </h2>

            <button
              onClick={() => setShowCreateProject(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + New project
            </button>
          </div>

          {projects === null ? (
            <p className="text-slate-400">Loading...</p>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center">
              <p className="text-slate-400 text-sm">
                No tenés proyectos asignados en esta company todavía. Puede que la
                company tenga proyectos de los que no sos miembro, o que todavía no
                se haya creado ninguno.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onSelect={goToProject} />
              ))}
            </div>
          )}
        </div>

      </div>

      {showCreateProject && (
        <CreateProjectModal
          companyId={companyId}
          close={() => setShowCreateProject(false)}
          onCreated={goToProject}
        />
      )}

      {confirmForceCount !== null && (
        <DeleteCompanyModal
          projectCount={confirmForceCount}
          confirming={deleting}
          error={deleteError}
          onCancel={() => setConfirmForceCount(null)}
          onConfirm={handleForceDelete}
        />
      )}

    </div>
  );
}
