import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { roleHasPermission, type OrgRole } from "@goodsignal/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { InviteMemberForm } from "@/components/members/invite-member-form";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Members & roles — Goodsignal" };
export const dynamic = "force-dynamic";

interface MemberRow {
  id: string;
  role: OrgRole;
  status: "INVITED" | "ACTIVE" | "DEACTIVATED";
  createdAt: string;
  userId: string;
  email: string;
  name: string;
}

interface InvitationRow {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  createdAt: string;
}

const ROLE_TONE: Record<OrgRole, "success" | "info" | "warning" | "neutral"> = {
  OWNER: "success",
  PROCUREMENT_MANAGER: "info",
  RECEIVER: "neutral",
  FINANCE: "warning",
};

export default async function MembersPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const [members, invitations] = await Promise.all([
    serverGet<MemberRow[]>("/api/v1/members"),
    serverGet<InvitationRow[]>("/api/v1/members/invitations"),
  ]);

  if (members.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Members & roles" />
        <Alert tone="error">
          Your role does not permit viewing organization members. Ask an owner for access.
        </Alert>
      </div>
    );
  }

  const canInvite = roleHasPermission(session.membership.role, "member:invite");
  const memberList = members.data ?? [];
  const invitationList = invitations.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Members & roles"
        description="Manage who can access this workspace and what they can do."
      />

      <Card>
        <CardHeader>
          <CardTitle>Invite a teammate</CardTitle>
        </CardHeader>
        <CardBody>
          <InviteMemberForm canInvite={canInvite} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({memberList.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {memberList.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No members yet" description="Invite teammates to collaborate on receiving and resolution." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {memberList.map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 font-medium text-ink">{m.name}</td>
                      <td className="px-5 py-3 text-subtle">{m.email}</td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={ROLE_TONE[m.role]}>
                          {m.role.replace(/_/g, " ").toLowerCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3 text-subtle">{m.status.toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {invitationList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations ({invitationList.length})</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {invitationList.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-ink">{inv.email}</span>
                  <span className="text-subtle">
                    {inv.role.replace(/_/g, " ").toLowerCase()} · expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
