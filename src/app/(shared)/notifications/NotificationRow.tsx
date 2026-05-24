"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteNotification, markNotificationRead } from "./actions";

export function NotificationRow({
  id,
  url,
  label,
  metaLine,
  timeLabel,
  isUnread,
}: {
  id: string;
  url: string;
  label: string;
  metaLine: string;
  timeLabel: string;
  isUnread: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClickRow() {
    if (!isUnread) return;
    startTransition(() => {
      void markNotificationRead(id);
    });
  }

  function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await deleteNotification(id);
      router.refresh();
    });
  }

  return (
    <Link
      href={url}
      onClick={onClickRow}
      aria-busy={pending || undefined}
      className={`ne-card transition-colors ${isUnread ? "border-primary/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground mt-1">{metaLine}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {timeLabel}
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label="Delete notification"
            title="Delete"
            className="ne-btn-ghost h-7 w-7 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
