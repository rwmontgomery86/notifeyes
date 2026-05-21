/**
 * Server-side upload helper. Same behavior as /api/upload but callable
 * directly from server actions (e.g. signup, where the user isn't
 * authenticated yet so they can't hit the auth-gated API route).
 *
 *   - With UPLOADTHING_TOKEN: forwards to UploadThing's REST API.
 *   - Without: stores the file as a base64 data URL. Fine for V1 dev.
 *     NOT suitable for production — once UploadThing is wired with real
 *     credentials, the data-URL branch never fires.
 */

import "server-only";
import { env } from "@/env";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type UploadOutcome =
  | { ok: true; url: string; size: number; name: string; dev?: boolean }
  | { ok: false; error: string };

export async function uploadFile(file: File): Promise<UploadOutcome> {
  if (!(file instanceof File)) {
    return { ok: false, error: "No file" };
  }
  if (file.size === 0) {
    return { ok: false, error: "Empty file" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File too large (4 MB max)" };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: `Unsupported file type ${file.type}` };
  }

  if (!env.UPLOADTHING_TOKEN) {
    const arr = await file.arrayBuffer();
    const b64 = Buffer.from(arr).toString("base64");
    return {
      ok: true,
      url: `data:${file.type};base64,${b64}`,
      size: file.size,
      name: file.name,
      dev: true,
    };
  }

  try {
    const prep = await fetch("https://api.uploadthing.com/v6/uploadFiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Uploadthing-Api-Key": env.UPLOADTHING_TOKEN,
      },
      body: JSON.stringify({
        files: [{ name: file.name, type: file.type, size: file.size }],
        acl: "public-read",
      }),
    });
    if (!prep.ok) {
      const text = await prep.text();
      return { ok: false, error: `UploadThing prep failed: ${text}` };
    }
    const data = (await prep.json()) as {
      data: { url: string; fileUrl: string; fields: Record<string, string> }[];
    };
    const slot = data.data[0];
    if (!slot) return { ok: false, error: "No upload slot" };

    const fd = new FormData();
    for (const [k, v] of Object.entries(slot.fields)) fd.append(k, v);
    fd.append("file", file);
    const put = await fetch(slot.url, { method: "POST", body: fd });
    if (!put.ok) {
      const text = await put.text();
      return { ok: false, error: `UploadThing put failed: ${text}` };
    }
    return { ok: true, url: slot.fileUrl, size: file.size, name: file.name };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
