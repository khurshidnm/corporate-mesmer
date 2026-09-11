"use client";

import { useState } from "react";
import Image from "next/image";
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

  // Calculate days until birthday
  const today = new Date();
  const birthday = new Date(user.birthday);
  const currentYear = today.getFullYear();

  // Сбрасываем время до начала дня для точного сравнения
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const thisYearBirthday = new Date(
    currentYear,
    birthday.getMonth(),
    birthday.getDate()
  );
  const nextYearBirthday = new Date(
    currentYear + 1,
    birthday.getMonth(),
    birthday.getDate()
  );

  let daysUntilBirthday: number;

  // Проверяем, сегодня ли день рождения
  if (todayStart.getTime() === thisYearBirthday.getTime()) {
    daysUntilBirthday = 0;
  } else if (thisYearBirthday > todayStart) {
    // День рождения еще не прошел в этом году
    daysUntilBirthday = Math.ceil(
      (thisYearBirthday.getTime() - todayStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  } else {
    // День рождения уже прошел в этом году, считаем до следующего года
    daysUntilBirthday = Math.ceil(
      (nextYearBirthday.getTime() - todayStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

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
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <CardContent className="p-4 lg:p-6 flex-1 flex flex-col">
          {/* Header with menu for admin - фиксированная высота */}
          <div className="h-8 flex justify-end mb-2">
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
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

          {/* Avatar - фиксированная высота */}
          <div className="h-[120px] lg:h-[200px] flex justify-center items-center mb-4 lg:mb-5">
            <div className="w-[100px] h-[100px] lg:w-[180px] lg:h-[180px] rounded-full overflow-hidden bg-gray-100">
              <Image
                src={user.avatar || "/placeholder.svg"}
                alt={getName()}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Name and Position - фиксированная высота */}
          <div className="h-[100px] lg:h-[120px] text-center mb-4 lg:mb-5 flex flex-col justify-center">
            <h3 className="font-medium text-gray-900 mb-1 text-sm lg:text-base leading-tight break-words">
              {getName()}
            </h3>
            <p className="text-xs lg:text-sm text-blue-600 font-medium uppercase tracking-wide leading-tight break-words">
              {getPosition()}
            </p>
          </div>

          {/* Contact Information - фиксированная высота */}
          <div className="flex-1 flex flex-col">
            {/* Основная контактная информация - таблица с фиксированными высотами строк */}
            <div className="mb-4">
              <table className="w-full border-collapse">
                <tbody>
                  {/* Email row - фиксированная высота */}
                  <tr className="h-10 lg:h-16 ">
                    <td className="w-8 lg:w-10 p-2 text-center align-top">
                      <Mail className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 mx-auto" />
                    </td>
                    <td className="p-2 text-xs lg:text-sm text-gray-600 break-all leading-tight align-top">
                      {user.email}
                    </td>
                  </tr>

                  {/* Phone row - фиксированная высота */}
                  <tr className="h-8 lg:h-8 ">
                    <td className="w-8 lg:w-10 p-2 text-center align-top">
                      <Phone className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 mx-auto" />
                    </td>
                    <td className="p-2 text-xs lg:text-sm text-gray-600 break-all leading-tight align-top">
                      {user.phone}
                    </td>
                  </tr>

                  {/* Building/Office row - фиксированная высота */}
                  <tr className="h-8 lg:h-8">
                    <td className="w-8 lg:w-10 p-2 text-center align-top">
                      <Building className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 mx-auto" />
                    </td>
                    <td className="p-2 text-xs lg:text-sm text-gray-600 break-all leading-tight align-top">
                      {getObjectName()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Birthday info - фиксированная позиция внизу и фиксированная высота */}
            <div className="mt-auto">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="h-8 lg:h-8 ">
                    <td className="w-8 lg:w-10 p-2 text-center align-top">
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500 mx-auto" />
                    </td>
                    <td className="p-2 align-top">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs lg:text-sm text-gray-600 leading-tight break-words">
                          {formatDate(user.birthday)}
                        </span>
                        <span
                          className={`text-xs ${getBirthdayTextColor(
                            daysUntilBirthday
                          )} leading-tight break-words`}
                        >
                          {formatDaysUntilBirthday(daysUntilBirthday)}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
        />
      )}
    </>
  );
}
