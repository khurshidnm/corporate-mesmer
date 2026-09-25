"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useGroups } from "@/hooks/use-groups";
import type { UserGroup } from "@/lib/groups";

interface GroupSelectProps {
  value?: UserGroup[] | UserGroup;
  onChange: (groups: UserGroup[]) => void;
  label?: string;
}

// Admin-only dropdown picker for an employee's group (single selection).
// Each employee may belong to at most one group.
export function GroupSelect({
  value,
  onChange,
  label = "Объект работы (Русский)",
}: GroupSelectProps) {
  const { t } = useTranslation();
  const { groups } = useGroups();

  const currentGroup: string = Array.isArray(value)
    ? value[0] || "none"
    : value || "none";

  return (
    <div className="space-y-2">
      <Label htmlFor="employee-group" className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={currentGroup}
        onValueChange={(val) => {
          onChange(val === "none" ? [] : [val as UserGroup]);
        }}
      >
        <SelectTrigger
          id="employee-group"
          className="border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 text-sm"
        >
          <SelectValue placeholder={t("form.selectGroup")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">{t("form.noGroup")}</span>
          </SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Backward-compatibility export
export const GroupCheckboxes = GroupSelect;
