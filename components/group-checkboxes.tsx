"use client";

import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { USER_GROUPS, type UserGroup } from "@/lib/groups";

interface GroupCheckboxesProps {
  value: UserGroup[];
  onChange: (groups: UserGroup[]) => void;
}

// Admin-only picker for which sidebar groups an employee appears in
export function GroupCheckboxes({ value, onChange }: GroupCheckboxesProps) {
  const { t } = useTranslation();

  const toggle = (id: UserGroup, checked: boolean) => {
    onChange(checked ? [...value, id] : value.filter((g) => g !== id));
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{t("form.groups")}</Label>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {USER_GROUPS.map((group) => (
          <div key={group.id} className="flex items-center gap-2">
            <input
              id={`group-${group.id}`}
              type="checkbox"
              checked={value.includes(group.id)}
              onChange={(e) => toggle(group.id, e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={`group-${group.id}`} className="text-sm">
              {group.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
