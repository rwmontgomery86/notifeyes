"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { postShiftDraft, deleteShiftDraft } from "./[id]/edit/actions";

export function DraftActions({ shiftId }: { shiftId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onPost() {
    startTransition(async () => {
      const res = await postShiftDraft(shiftId);
      if (!res.ok) {
        alert(res.error ?? "Could not post draft");
        return;
      }
      router.push("/p/shifts?status=posted");
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    startTransition(async () => {
      const res = await deleteShiftDraft(shiftId);
      if (!res.ok) {
        alert(res.error ?? "Could not delete draft");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/p/shifts/${shiftId}/edit`}
        className="ne-btn-ghost h-8 px-3 text-xs"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={onPost}
        disabled={pending}
        className="ne-btn h-8 px-3 text-xs"
      >
        {pending ? "Working…" : "Post"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="ne-btn-ghost h-8 px-3 text-xs text-destructive"
      >
        Delete
      </button>
    </div>
  );
}
