// Employee groups that admins can assign people to. Each group gets its own
// section in the sidebar; a person may belong to several groups at once.
// The labels are proper names, so they are the same in every language.
export const USER_GROUPS = [
  { id: "mesmer", label: "MESMER" },
  { id: "mesal", label: "MESAL" },
  { id: "maxsus", label: "Special" },
] as const;

export type UserGroup = (typeof USER_GROUPS)[number]["id"];

export const USER_GROUP_IDS = USER_GROUPS.map((g) => g.id) as UserGroup[];

// Sidebar section key for a group, e.g. "group:mesal"
export const GROUP_SECTION_PREFIX = "group:";

export function groupFromSection(section: string): UserGroup | null {
  if (!section.startsWith(GROUP_SECTION_PREFIX)) return null;
  const id = section.slice(GROUP_SECTION_PREFIX.length) as UserGroup;
  return USER_GROUP_IDS.includes(id) ? id : null;
}

// Keeps only known group ids from client input; undefined if input isn't an array
export function sanitizeGroups(input: unknown): UserGroup[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return [...new Set(input)].filter((g): g is UserGroup =>
    USER_GROUP_IDS.includes(g)
  );
}
