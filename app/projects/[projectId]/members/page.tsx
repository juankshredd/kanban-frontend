"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ProjectDetail, ProjectRole } from "@/types/project";

export default function MembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [actioningUserId, setActioningUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const fetchProject = async () => {
    const data = await api(`/projects/${projectId}`, "GET");
    setProject(data);
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const isOwner = project?.role === "OWNER";

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("El email es obligatorio");
      return;
    }

    setInviteError("");
    setInviting(true);

    try {
      await api(`/projects/${projectId}/members`, "POST", {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setInviteEmail("");
      setInviteRole("MEMBER");
      fetchProject();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "No se pudo invitar al usuario");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: ProjectRole) => {
    setActionError("");
    setActioningUserId(userId);

    try {
      await api(`/projects/${projectId}/members/${userId}`, "PATCH", { role });
      fetchProject();
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
      await api(`/projects/${projectId}/members/${userId}`, "DELETE");
      fetchProject();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo quitar al miembro");
    } finally {
      setActioningUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="mb-8">
        <button
          onClick={() => router.push(`/projects/${projectId}/board`)}
          className="text-slate-400 hover:text-slate-200 text-sm mb-2 transition"
        >
          ← Board
        </button>
        <h1 className="text-3xl font-bold">
          {project ? (
            <>
              <span className="text-blue-400 font-mono mr-2">{project.key}</span>
              Members
            </>
          ) : (
            "Loading..."
          )}
        </h1>
      </div>

      {project && (
        <div className="max-w-2xl">

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
              {actionError}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
            {project.members.map((member) => (
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
                      onChange={(e) => handleRoleChange(member.id, e.target.value as ProjectRole)}
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
              <h2 className="text-white font-semibold mb-3">Invite by email</h2>

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
                  onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
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

        </div>
      )}

    </div>
  );
}
