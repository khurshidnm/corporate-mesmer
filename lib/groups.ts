// Employee groups that admins can assign people to. Each group gets its own
// section in the sidebar; each person may belong to at most one group.
// The labels are proper names, so they are the same in every language.

export const SUPER_ADMIN_EMAIL = "admin@mesmer.uz";

export function isSuperAdmin(email?: string | null): boolean {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export interface UserGroupItem {
  id: string;
  label: string;
  order?: number;
}

export const DEFAULT_GROUPS: UserGroupItem[] = [
  { id: "mesmer", label: "MESMER", order: 1 },
  { id: "mesal", label: "MESAL", order: 2 },
  { id: "maxsus", label: "Maxsus", order: 3 },
  { id: "prestige_proekt", label: "Prestige Proekt", order: 4 },
];

export const USER_GROUPS = DEFAULT_GROUPS;

export type UserGroup = string;

export const USER_GROUP_IDS = USER_GROUPS.map((g) => g.id);

// Sidebar section key for a group, e.g. "group:mesal"
export const GROUP_SECTION_PREFIX = "group:";

export function groupFromSection(section: string): string | null {
  if (!section.startsWith(GROUP_SECTION_PREFIX)) return null;
  return section.slice(GROUP_SECTION_PREFIX.length);
}

// Keeps only known group ids from client input (at most one); undefined if input isn't recognized
export function sanitizeGroups(
  input: unknown,
  allowedIds?: string[]
): string[] | undefined {
  if (typeof input === "string") {
    const val = input.trim().toLowerCase();
    if (!val || val === "none") return [];
    if (!allowedIds || allowedIds.includes(val)) return [val];
    return [];
  }
  if (!Array.isArray(input)) return undefined;
  const filtered = input
    .filter((g): g is string => typeof g === "string" && g.trim() !== "" && g !== "none")
    .map((g) => g.trim().toLowerCase());
  const valid = [...new Set(filtered)].filter(
    (g) => !allowedIds || allowedIds.includes(g)
  );
  // Each user belongs to at most one group
  return valid.slice(0, 1);
}
