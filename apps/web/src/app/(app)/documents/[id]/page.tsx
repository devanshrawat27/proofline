import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { DocumentDto, DocumentExtractionDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentReview } from "@/components/documents/document-review";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Document" };

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const docResult = await serverGet<DocumentDto>(`/api/v1/documents/${params.id}`);
  if (docResult.status === 404) notFound();
  if (docResult.status === 403 || !docResult.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Document" />
        <Alert tone="error">This document could not be loaded.</Alert>
      </div>
    );
  }

  const document = docResult.data;
  const extractionResult = await serverGet<DocumentExtractionDto | null>(
    `/api/v1/documents/${document.id}/extraction`,
  );
  const canReview = roleHasPermission(session.membership.role, "document:review");

  return (
    <div className="space-y-8">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to documents
      </Link>

      <PageHeader
        title={document.fileName}
        description={
          <span>
            {document.kind.toLowerCase()} · {document.entityType.replace(/_/g, " ").toLowerCase()} document
          </span>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Extraction review</CardTitle>
        </CardHeader>
        <CardBody>
          <DocumentReview
            document={document}
            initialExtraction={extractionResult.data ?? null}
            canReview={canReview}
          />
        </CardBody>
      </Card>
    </div>
  );
}
