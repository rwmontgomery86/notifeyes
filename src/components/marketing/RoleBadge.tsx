type Role = "practice" | "od";

export function RoleBadge({ role }: { role: Role }) {
  const styles =
    role === "od"
      ? "text-rust bg-rust-soft border-[#a8d5f0]"
      : "text-ink border-current";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {role === "od" ? "Optometrist" : "Practice"}
    </span>
  );
}
