"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideVerification } from "./actions";

export function VerificationActions({ odId }: { odId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");

  function go(decision: "approve" | "reject") {
    startTransition(async () => {
      await decideVerification(odId, decision, notes);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 min-w-64">
      <input
        type="text"
        className="ne-input"
        placeholder="Notes (visible to OD if rejected)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => go("reject")}
          disabled={pending}
          className="ne-btn-secondary"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => go("approve")}
          disabled={pending}
          className="ne-btn"
        >
          Approve
        </button>
      </div>
    </div>
  );
}
