"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPayoutSent, markPayoutFailed } from "./actions";

export function PayoutActions({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex justify-end gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            await markPayoutFailed(payoutId);
            router.refresh();
          })
        }
        disabled={pending}
        className="ne-btn-ghost h-8 px-2 text-xs"
      >
        Flag issue
      </button>
      <button
        onClick={() =>
          startTransition(async () => {
            await markPayoutSent(payoutId);
            router.refresh();
          })
        }
        disabled={pending}
        className="ne-btn h-8 px-2 text-xs"
      >
        Mark paid
      </button>
    </div>
  );
}
