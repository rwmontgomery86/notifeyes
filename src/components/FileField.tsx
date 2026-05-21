"use client";

import { useState, useRef } from "react";

/**
 * Reusable file field. Posts to /api/upload and stores the resulting URL.
 * Falls back to a data URL in dev when UPLOADTHING_TOKEN is unset.
 */
export function FileField({
  label,
  value,
  onChange,
  accept,
}: {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url as string);
    } catch (e) {
      setErr(String(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="ne-label">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="flex items-center gap-2">
            {value.startsWith("data:image") || /\.(jpe?g|png|webp)(\?|$)/i.test(value) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={label} className="h-12 w-12 rounded object-cover border" />
            ) : (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary"
              >
                View uploaded file
              </a>
            )}
            <button
              type="button"
              onClick={() => onChange(null)}
              className="ne-btn-ghost h-8 px-2 text-xs"
            >
              Remove
            </button>
          </div>
        ) : null}
        <label className="ne-btn-secondary cursor-pointer">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={onSelect}
          />
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </label>
      </div>
      {err ? (
        <div className="mt-1 text-xs text-destructive">{err}</div>
      ) : null}
    </div>
  );
}
