type Cell = {
  text: string;
  tone?: "yes" | "no" | "neutral";
};

export type CompareRow = {
  label: string;
  cells: Cell[]; // length must match columns.length
};

export function CompareTable({
  columns,
  highlightIndex,
  rows,
}: {
  columns: string[];
  highlightIndex: number;
  rows: CompareRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="border-b border-ink-3 py-4 px-[18px] text-left font-sans text-xs font-medium uppercase tracking-[0.08em] text-ink-3 align-top">
              {/* empty corner */}
            </th>
            {columns.map((col, i) => (
              <th
                key={col}
                className={`border-b border-ink py-4 px-[18px] text-left font-display text-lg font-semibold text-ink align-top ${
                  i === highlightIndex ? "bg-rust-soft" : ""
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <td className="border-b border-rule py-4 px-[18px] font-medium align-top text-ink">
                {row.label}
              </td>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`border-b border-rule py-4 px-[18px] align-top ${
                    i === highlightIndex ? "bg-rust-soft" : ""
                  } ${
                    cell.tone === "yes"
                      ? "text-sage font-semibold"
                      : cell.tone === "no"
                        ? "text-ink-3"
                        : "text-ink-2"
                  }`}
                >
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
