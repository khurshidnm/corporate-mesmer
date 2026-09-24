"use client";

import { useState } from "react";
import { LazyAvatar } from "./lazy-avatar";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EmployeeActionsMenu, useBirthdayLabels } from "./employee-card";
import { GroupBadges } from "./group-badges";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { daysUntilBirthday as daysUntil } from "@/lib/birthday";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import type { User } from "@/types";

interface EmployeeTableProps {
  users: User[];
  loading?: boolean;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onUpdate: (user: User) => void;
  onDelete: (userId: string) => void;
}

const SKELETON_ROWS = 8;

// Compact list alternative to the card grid; same data, same admin actions
export function EmployeeTable({
  users,
  loading = false,
  userRole,
  currentUserId,
  onUpdate,
  onDelete,
}: EmployeeTableProps) {
  const { t } = useTranslation();
  const canEdit = userRole === "admin";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-[960px]">
        <TableHeader className="bg-slate-50">
          <TableRow className="whitespace-nowrap hover:bg-transparent">
            <TableHead className="pl-4">{t("form.name")}</TableHead>
            <TableHead>{t("form.objectName")}</TableHead>
            <TableHead>{t("form.email")}</TableHead>
            <TableHead>{t("form.phone")}</TableHead>
            <TableHead>{t("form.birthday")}</TableHead>
            {canEdit && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  {canEdit && <TableCell />}
                </TableRow>
              ))
            : users.map((user) => (
                <EmployeeRow
                  key={user._id}
                  user={user}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmployeeRow({
  user,
  userRole,
  currentUserId,
  onUpdate,
  onDelete,
}: {
  user: User;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onUpdate: (user: User) => void;
  onDelete: (userId: string) => void;
}) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { formatDate, formatDaysUntilBirthday, getBirthdayTextColor } =
    useBirthdayLabels();

  const canEdit = userRole === "admin";
  const days = daysUntil(user.birthday);
  const isBirthdayToday = days === 0;

  const name = user.name[language] || user.name.ru;
  const position = user.position[language] || user.position.ru;

  return (
    <>
      <TableRow className={isBirthdayToday ? "bg-fuchsia-50/60 hover:bg-fuchsia-50" : undefined}>
        <TableCell className="pl-4">
          <div className="flex min-w-0 items-center gap-3">
            <LazyAvatar
              src={user.avatar || "/placeholder.svg"}
              alt={name}
              className={`h-10 w-10 shrink-0 rounded-full ${
                isBirthdayToday ? "ring-2 ring-fuchsia-400" : ""
              }`}
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900" title={name}>
                {name}
                {isBirthdayToday && <span className="ml-1.5">🎂</span>}
              </p>
              <p className="truncate text-xs font-medium uppercase tracking-wide text-blue-700">
                {position}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <GroupBadges groups={user.groups} nowrap />
        </TableCell>
        <TableCell>
          <a href={`mailto:${user.email}`} className="text-slate-600 hover:text-blue-700 hover:underline">
            {user.email}
          </a>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <a href={`tel:${user.phone}`} className="text-slate-600 hover:text-blue-700 hover:underline">
            {user.phone}
          </a>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {user.birthday && (
            <>
              <p className="font-medium text-slate-700">{formatDate(user.birthday)}</p>
              {days !== null && (
                <p className={`text-xs ${getBirthdayTextColor(days)}`}>
                  {isBirthdayToday
                    ? t("birthday.todayBirthdayShort")
                    : formatDaysUntilBirthday(days)}
                </p>
              )}
            </>
          )}
        </TableCell>
        {canEdit && (
          <TableCell className="pr-3 text-right">
            <EmployeeActionsMenu
              onEdit={() => setShowEditDialog(true)}
              onDelete={user._id !== currentUserId ? () => onDelete(user._id) : undefined}
            />
          </TableCell>
        )}
      </TableRow>

      {canEdit && (
        <EditEmployeeDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={user}
          onUpdate={onUpdate}
          userRole={userRole}
        />
      )}
    </>
  );
}
