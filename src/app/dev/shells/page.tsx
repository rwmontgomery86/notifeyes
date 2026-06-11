import { notFound } from "next/navigation";
import { ShellGallery } from "./ShellGallery";

export const metadata = { title: "Shell gallery · NotifEyes dev" };

export default function DevShellsPage() {
  // Dev/preview-only design exploration. VERCEL_ENV is "production" only on
  // production deploys (undefined locally, "preview" on preview deploys), so
  // the gate bakes a 404 into the prod build while staying viewable on
  // localhost and Vercel previews. Direct process.env access matches the
  // pattern in src/instrumentation.ts — env.ts validates a fixed allowlist
  // and must not be imported from the client tree.
  if (process.env.VERCEL_ENV === "production") notFound();
  return <ShellGallery />;
}
