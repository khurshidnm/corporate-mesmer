"use client";

import { useGroups } from "@/hooks/use-groups";
import type { UserGroup } from "@/lib/groups";

// The employee's group as a small pill; "—" when none.
// `nowrap` keeps them on one line (table cells).
export function GroupBadges({
  groups,
  nowrap = false,
}: {
  groups?: UserGroup[];
  nowrap?: boolean;
}) {
  const { groups: allGroups } = useGroups();
  const assigned = allGroups.filter((g) => groups?.includes(g.id));

  if (assigned.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <span className={`flex gap-1 ${nowrap ? "flex-nowrap" : "flex-wrap"}`}>
      {assigned.map((g) => (
        <span
          key={g.id}
          className="whitespace-nowrap rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-100 dark:ring-blue-900/60"
        >
          {g.label}
        </span>
      ))}
    </span>
  );
}
