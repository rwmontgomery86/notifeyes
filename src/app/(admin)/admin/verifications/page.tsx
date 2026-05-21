import { desc, eq } from "drizzle-orm";
import { optometrists } from "@/db/schema";
import { db } from "@/db";
import { VerificationActions } from "./VerificationActions";

export const metadata = { title: "OD verifications · NotifEyes admin" };

export default async function VerificationsPage() {
  const pending = await db
    .select()
    .from(optometrists)
    .where(eq(optometrists.verificationStatus, "pending"))
    .orderBy(desc(optometrists.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold">OD verifications</h1>
      <p className="mt-1 text-muted-foreground">
        Review uploaded license documents. Approve to unlock the apply button
        for this OD.
      </p>

      {pending.length === 0 ? (
        <div className="ne-card mt-8 text-sm text-muted-foreground">
          No pending verifications. ✨
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {pending.map((od) => (
            <li key={od.id} className="ne-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{od.name}</div>
                  <div className="text-xs text-muted-foreground">
                    License {od.licenseState} #{od.licenseNumber ?? "—"}
                  </div>
                  {od.licenseDocUrl ? (
                    <a
                      href={od.licenseDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      View license doc →
                    </a>
                  ) : (
                    <div className="mt-2 text-xs text-amber-700">
                      No license doc uploaded yet
                    </div>
                  )}
                </div>
                <VerificationActions odId={od.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
