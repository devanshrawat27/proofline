import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { OrganizationForm } from "@/components/settings/organization-form";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  defaultCurrency: string;
  isDemo: boolean;
}

export default async function SettingsPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const org = await serverGet<OrganizationRow>("/api/v1/organization");
  if (org.status !== 200 || !org.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <Card>
          <CardBody>Unable to load organization settings right now. Please try again.</CardBody>
        </Card>
      </div>
    );
  }

  const canEdit = roleHasPermission(session.membership.role, "org:update");

  return (
    <div className="space-y-8">
      <PageHeader title="Organization settings" description="Profile, locale and currency defaults." />
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <OrganizationForm
            canEdit={canEdit}
            initial={{
              name: org.data.name,
              timezone: org.data.timezone,
              defaultCurrency: org.data.defaultCurrency,
            }}
          />
        </CardBody>
      </Card>
      <p className="text-xs text-subtle">
        Workspace slug: <span className="font-mono">{org.data.slug}</span>
      </p>
    </div>
  );
}
