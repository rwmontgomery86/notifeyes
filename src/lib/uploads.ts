/**
 * UploadThing wiring.
 *
 * UploadThing is the V1 file-upload choice (locked decision). It requires
 * UPLOADTHING_TOKEN in env. Without the token, the upload route returns a
 * dev-only fallback: a data URL embedded in the field. That's not suitable
 * for production but keeps M4 testable without an external account.
 *
 * The UI uses a plain <input type="file"> + this helper instead of the
 * @uploadthing/react component so that the dev fallback works the same way.
 */

import { env } from "@/env";

export const UPLOAD_ENABLED = Boolean(env.UPLOADTHING_TOKEN);

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}
