"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NotificationDto } from "@proofline/shared-types";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-header";

export function NotificationList({
  items,
  apiBase,
  caseHrefBase,
}: {
  items: NotificationDto[];
  apiBase: string;
  caseHrefBase: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const hasUnread = items.some((item) => !item.readAt);

  async function openItem(item: NotificationDto) {
    if (!item.readAt) {
      await apiFetch(`${apiBase}/${item.id}/read`, { method: "POST" }).catch(() => undefined);
    }
    if (item.entityType === "DisputeCase" && item.entityId) {
      router.push(`${caseHrefBase}/${item.entityId}`);
    } else {
      router.refresh();
    }
  }

  async function markAll() {
    setBusy(true);
    try {
      await apiFetch(`${apiBase}/read-all`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>All notifications ({items.length})</CardTitle>
        {hasUnread ? (
          <Button variant="secondary" size="sm" onClick={markAll} loading={busy}>
            {busy ? "Marking…" : "Mark all read"}
          </Button>
        ) : null}
      </CardHeader>
      <CardBody className="p-0">
        {items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No notifications" description="Updates about your cases will appear here." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => openItem(item)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-app"
                >
                  <span
                    aria-hidden
                    className={
                      item.readAt
                        ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-line"
                        : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                    }
                  />
                  <span className="min-w-0">
                    <span className={item.readAt ? "block text-sm text-subtle" : "block text-sm font-medium text-ink"}>
                      {item.title}
                    </span>
                    {item.body ? <span className="mt-0.5 block text-sm text-subtle">{item.body}</span> : null}
                    <span className="mt-1 block text-xs text-subtle">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
