"use client";

import { useState } from "react";
import { Bell, Gift, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { TeamBirthdayModal } from "./team-birthday-modal";
import { BirthdayWelcomeModal } from "./birthday-welcome-modal";
import { useLanguage } from "@/hooks/use-language";
import { getLocalizedText } from "@/lib/utils";
import type { BirthdayUser } from "@/types";
import { LazyAvatar } from "./lazy-avatar";

interface BirthdayNotificationBellProps {
  /** Birthdays in the next 7 days, fetched once by the page and shared */
  birthdays: BirthdayUser[];
}

export function BirthdayNotificationBell({
  birthdays: upcomingBirthdays,
}: BirthdayNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showTeamBirthdayModal, setShowTeamBirthdayModal] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const formatDaysUntil = (days: number) => {
    if (days === 0) return language === "ru" ? "Сегодня" : "Today";
    if (days === 1) return language === "ru" ? "Завтра" : "Tomorrow";
    return language === "ru" ? `Через ${days} дней` : `In ${days} days`;
  };

  const handleUserClick = (user: BirthdayUser) => {
    setIsOpen(false);
    if (user.daysUntilBirthday === 0) {
      setShowTeamBirthdayModal(true);
    } else {
      setShowBirthdayModal(true);
    }
  };

  const todayUsers = upcomingBirthdays.filter(
    (user) => user.daysUntilBirthday === 0
  );
  const totalCount = upcomingBirthdays.length;
  const hasBirthdayToday = todayUsers.length > 0;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8 lg:h-10 lg:w-10 text-slate-700 dark:text-slate-200"
          >
            <Bell
              className={`w-4 h-4 lg:w-5 lg:h-5 origin-top ${
                hasBirthdayToday
                  ? "text-fuchsia-600 dark:text-fuchsia-400 animate-bell-ring motion-reduce:animate-none"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            />
            {totalCount > 0 && (
              <Badge
                className={`absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 rounded-full p-0 flex items-center justify-center text-xs text-white border-0 ${
                  hasBirthdayToday ? "bg-fuchsia-600" : "bg-blue-600"
                }`}
              >
                {totalCount > 9 ? "9+" : totalCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 lg:w-96 p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
          align="end"
        >
          <div className="p-3 lg:p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm lg:text-base">
              <Gift className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === "ru" ? "Скоро дни рождения" : "Upcoming Birthdays"}
            </h3>
          </div>
          <ScrollArea className="max-h-80 lg:max-h-96">
            {upcomingBirthdays.length === 0 ? (
              <div className="p-4 lg:p-6 text-center text-slate-500 dark:text-slate-400">
                <Calendar className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm lg:text-base">
                  {language === "ru"
                    ? "Нет ближайших дней рождения"
                    : "No upcoming birthdays"}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {upcomingBirthdays.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-start space-x-3 p-3 lg:p-4 rounded-lg mb-2 transition-colors cursor-pointer ${
                      user.daysUntilBirthday === 0
                        ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                    onClick={() => handleUserClick(user)}
                  >
                    <LazyAvatar
                      src={user.avatar || "/placeholder.svg"}
                      alt={getLocalizedText(user.name, language)}
                      className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex-shrink-0 mt-1"
                    />
                    <div className="flex-1 min-w-0 space-y-1 max-w-[200px] lg:max-w-[250px]">
                      <p className="font-medium text-sm lg:text-base text-slate-900 dark:text-slate-100 leading-tight break-all word-wrap overflow-wrap-anywhere hyphens-auto">
                        {getLocalizedText(user.name, language)}
                      </p>
                      <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 leading-tight break-all word-wrap overflow-wrap-anywhere hyphens-auto">
                        {getLocalizedText(user.position, language)}
                      </p>
                      <div className="flex items-center gap-1 pt-1">
                        <span
                          className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${
                            user.daysUntilBirthday === 0
                              ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                              : user.daysUntilBirthday <= 3
                              ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {user.daysUntilBirthday === 365
                            ? language === "ru"
                              ? "Сегодня"
                              : "Today"
                            : formatDaysUntil(user.daysUntilBirthday)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Birthday Modals */}
      <BirthdayWelcomeModal
        users={upcomingBirthdays}
        open={showBirthdayModal}
        onOpenChange={setShowBirthdayModal}
      />

      <TeamBirthdayModal
        users={todayUsers}
        open={showTeamBirthdayModal}
        onOpenChange={setShowTeamBirthdayModal}
      />
    </>
  );
}
