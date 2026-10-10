import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

interface MemberRow {
  id: string;
  role: string;
  status: string;
}

export default async function OverviewPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const members = await serverGet<MemberRow[]>("/api/v1/members");
  const memberCount = members.status === 200 && members.data ? members.data.length : null;
  const org = session.organization;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${session.user.name.split(" ")[0]}`}
        description="Here is the state of your delivery discrepancy workspace."
        actions={
          <Button
            disabled
            title="Receiving arrives in a later phase"
            className="cursor-not-allowed"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Record a delivery
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Team members" value={memberCount !== null ? String(memberCount) : "—"} note="Active users in this organization" />
        <MetricCard label="Open exceptions" value="—" note="Available once receiving is enabled" />
        <MetricCard label="Disputed value" value="—" note="Available once cases are enabled" />
        <MetricCard
          label="Your role"
          value={session.membership.role.replace(/_/g, " ").toLowerCase()}
          note="Access is enforced on the server"
        />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-subtle" aria-hidden />
            Needs attention
          </CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            icon={<ClipboardCheck className="h-6 w-6" aria-hidden />}
            title="No deliveries recorded yet"
            description="Once you create a purchase order and record a receipt, quantity and invoice mismatches will appear here with their source evidence."
          />
        </CardBody>
      </Card>

      {org ? (
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Detail label="Organization" value={org.name} />
            <Detail label="Currency" value={org.defaultCurrency} />
            <Detail label="Timezone" value={org.timezone} />
          </CardBody>
        </Card>
      ) : null}

      <p className="text-xs text-subtle">
        Looking for your team?{" "}
        <Link href="/members" className="font-medium text-brand hover:underline">
          Manage members &amp; roles
        </Link>
        .
      </p>
    </div>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        <p className="mt-2 text-2xl font-semibold capitalize tabular-nums text-ink">{value}</p>
        <p className="mt-1 text-xs text-subtle">{note}</p>
      </CardBody>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
