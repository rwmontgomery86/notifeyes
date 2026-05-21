"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setApplicationStatus } from "./actions";

export function ApplicantActions({
  applicationId,
  shiftId,
  status,
}: {
  applicationId: string;
  shiftId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(to: string) {
    startTransition(async () => {
      await setApplicationStatus(applicationId, to);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "applied" ? (
        <>
          <button
            onClick={() => move("shortlisted")}
            disabled={pending}
            className="ne-btn-secondary h-8 px-2 text-xs"
          >
            Shortlist
          </button>
          <button
            onClick={() => move("declined")}
            disabled={pending}
            className="ne-btn-ghost h-8 px-2 text-xs"
          >
            Decline
          </button>
        </>
      ) : null}
      {status === "shortlisted" ? (
        <>
          <Link
            href={`/p/shifts/${shiftId}/book/${applicationId}`}
            className="ne-btn h-8 px-2 text-xs"
          >
            Book →
          </Link>
          <button
            onClick={() => move("declined")}
            disabled={pending}
            className="ne-btn-ghost h-8 px-2 text-xs"
          >
            Decline
          </button>
        </>
      ) : null}
      {status === "applied" ? (
        <Link
          href={`/p/shifts/${shiftId}/book/${applicationId}`}
          className="ne-btn h-8 px-2 text-xs"
        >
          Book →
        </Link>
      ) : null}
    </div>
  );
}
