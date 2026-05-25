"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockPractice, unblockPractice } from "./actions";

export function BlockButton({
  practiceId,
  practiceName,
  initiallyBlocked,
}: {
  practiceId: string;
  practiceName: string;
  initiallyBlocked: boolean;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function doBlock() {
    setConfirming(false);
    startTransition(async () => {
      await blockPractice(practiceId);
      setBlocked(true);
      router.refresh();
    });
  }

  function doUnblock() {
    startTransition(async () => {
      await unblockPractice(practiceId);
      setBlocked(false);
      router.refresh();
    });
  }

  if (blocked) {
    return (
      <button
        type="button"
        onClick={doUnblock}
        disabled={pending}
        className="ne-btn-ghost text-xs"
      >
        {pending ? "Unblocking…" : "Unblock practice"}
      </button>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs">
        <span className="text-muted-foreground">
          Hide {practiceName} from your feed?
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={doBlock}
            disabled={pending}
            className="ne-btn-secondary text-xs"
          >
            {pending ? "Blocking…" : "Yes, block"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="ne-btn-ghost text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="ne-btn-ghost text-xs"
    >
      Block practice
    </button>
  );
}
