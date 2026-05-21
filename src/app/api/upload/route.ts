import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/upload-server";

export const runtime = "nodejs";

/**
 * Authenticated upload endpoint. Used by the FileField component for
 * profile photos, credential docs, and message attachments.
 *
 * For uploads during flows where the user isn't authenticated yet (e.g.
 * OD signup), server actions call `uploadFile()` directly.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const result = await uploadFile(file);
  if (!result.ok) {
    const status =
      result.error.includes("too large") ? 413
        : result.error.includes("Unsupported") ? 415
          : 502;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
