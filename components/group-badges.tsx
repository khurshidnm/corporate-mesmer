import { USER_GROUPS, type UserGroup } from "@/lib/groups";

// The employee's groups as small pills, in sidebar order; "—" when none.
// `nowrap` keeps them on one line (table cells).
export function GroupBadges({
  groups,
  nowrap = false,
}: {
  groups?: UserGroup[];
  nowrap?: boolean;
}) {
  const assigned = USER_GROUPS.filter((g) => groups?.includes(g.id));

  if (assigned.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <span className={`flex gap-1 ${nowrap ? "flex-nowrap" : "flex-wrap"}`}>
      {assigned.map((g) => (
        <span
          key={g.id}
          className="whitespace-nowrap rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100"
        >
          {g.label}
        </span>
      ))}
    </span>
  );
}
