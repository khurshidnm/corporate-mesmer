"use client";

import { useState } from "react";
import { LazyAvatar } from "./lazy-avatar";
import { FestiveRing } from "./birthday-fx";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntilBirthday as daysUntil } from "@/lib/birthday";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import {
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Building,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import type { User } from "@/types";

interface EmployeeCardProps {
  user: User;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onUpdate: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function EmployeeCard({
  user,
  userRole,
  currentUserId,
  onUpdate,
  onDelete,
}: EmployeeCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Форматирование даты в зависимости от выбранного языка
    if (language === "ru") {
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
      });
    }
  };

  // Только админ может редактировать и удалять пользователей
  const canEdit = userRole === "admin";

  const daysUntilBirthday = daysUntil(user.birthday) ?? 0;
  const isBirthdayToday = daysUntilBirthday === 0;

  const formatDaysUntilBirthday = (days: number) => {
    if (days === 0) return t("birthday.todayBirthday");
    if (days === 1) return t("birthday.tomorrowBirthday");
    return t("birthday.daysUntilBirthday", { days });
  };

  const getBirthdayTextColor = (days: number) => {
    if (days === 0) return "text-pink-600 font-semibold";
    if (days <= 7) return "text-orange-600 font-medium";
    if (days <= 30) return "text-blue-600";
    return "text-gray-500";
  };

  // Get localized text based on current language
  const getName = () => user.name[language] || user.name.ru;
  const getPosition = () => user.position[language] || user.position.ru;
  const getObjectName = () => user.object_name[language] || user.object_name.ru;

  return (
    <>
      <Card
        className={`group relative h-full overflow-hidden border bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
          isBirthdayToday
            ? "border-fuchsia-200 shadow-fuchsia-100 hover:border-fuchsia-300"
            : "border-slate-200 hover:border-blue-200"
        }`}
      >
        {isBirthdayToday && (
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-amber-400"
          />
        )}
        <CardContent className="flex h-full flex-col p-4 lg:p-5">
          <div className="flex h-7 items-center justify-end">
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={t("actions.edit")}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                  {user._id !== currentUserId && (
                    <DropdownMenuItem
                      onClick={() => onDelete(user._id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mb-4 flex h-[120px] items-center justify-center lg:mb-5 lg:h-[200px]">
            {isBirthdayToday ? (
              <div className="relative">
                <FestiveRing>
                  <LazyAvatar
                    src={user.avatar || "/placeholder.svg"}
                    alt={getName()}
                    className="h-[92px] w-[92px] rounded-full lg:h-[172px] lg:w-[172px]"
                  />
                </FestiveRing>
                <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-md ring-2 ring-fuchsia-100 animate-bounce motion-reduce:animate-none lg:h-11 lg:w-11 lg:text-2xl">
                  🎂
                </span>
              </div>
            ) : (
              <LazyAvatar
                src={user.avatar || "/placeholder.svg"}
                alt={getName()}
                className="h-[100px] w-[100px] rounded-full ring-4 ring-slate-50 lg:h-[180px] lg:w-[180px]"
              />
            )}
          </div>

          <div className="mb-4 min-h-[58px] text-center lg:mb-5 lg:min-h-[64px]">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 lg:text-base" title={getName()}>
              {getName()}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs font-medium uppercase tracking-wide text-blue-700">
              {getPosition()}
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div className="flex min-w-0 items-start gap-3 text-slate-600">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="break-all leading-5">{user.email}</span>
            </div>
            <div className="flex min-w-0 items-start gap-3 text-slate-600">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="leading-5">{user.phone}</span>
            </div>
            <div className="flex min-w-0 items-start gap-3 text-slate-600">
              <Building className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="line-clamp-2 leading-5">{getObjectName()}</span>
            </div>
          </div>

          <div className="mt-auto flex items-start gap-3 border-t border-slate-100 pt-4">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">{formatDate(user.birthday)}</p>
              {isBirthdayToday ? (
                <span className="mt-1 inline-block whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  {t("birthday.todayBirthdayShort")}
                </span>
              ) : (
                <p className={`mt-0.5 text-xs ${getBirthdayTextColor(daysUntilBirthday)}`}>
                  {formatDaysUntilBirthday(daysUntilBirthday)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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

// Placeholder shown while the directory is loading; mirrors the card layout
// so the grid doesn't reflow when the real cards arrive.
export function EmployeeCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border border-slate-200 bg-white shadow-sm">
      <CardContent className="flex h-full flex-col p-4 lg:p-5">
        <div className="mb-4 flex h-[120px] items-center justify-center lg:mb-5 lg:h-[200px]">
          <Skeleton className="h-[100px] w-[100px] rounded-full lg:h-[180px] lg:w-[180px]" />
        </div>
        <div className="mb-4 flex min-h-[58px] flex-col items-center gap-2 lg:mb-5 lg:min-h-[64px]">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}
