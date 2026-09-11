"use client";

import { useState, useEffect } from "react";
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

export function BirthdayNotificationBell() {
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showTeamBirthdayModal, setShowTeamBirthdayModal] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();

  useEffect(() => {
    fetchUpcomingBirthdays();
  }, []);

  const fetchUpcomingBirthdays = async () => {
    try {
      const response = await fetch("/api/users/upcoming-birthdays?days=7");
      if (response.ok) {
        const data = await response.json();
        setUpcomingBirthdays(data);
      }
    } catch (error) {
      console.error("Error fetching upcoming birthdays:", error);
    }
  };

  const formatDaysUntil = (days: number) => {
    if (days === 0) return language === "ru" ? "Сегодня" : "Today";
    if (days === 1) return language === "ru" ? "Завтра" : "Tomorrow";
    return language === "ru" ? `Через ${days} дней` : `In ${days} days`;
  };

  const handleUserClick = (user: BirthdayUser) => {
    setIsOpen(false);
    if (user.daysUntilBirthday === 0) {
      // Get all users with birthdays today
      const todayUsers = upcomingBirthdays.filter(
        (u) => u.daysUntilBirthday === 0
      );
      setShowTeamBirthdayModal(true);
    } else {
      setShowBirthdayModal(true);
    }
  };

  const todayUsers = upcomingBirthdays.filter(
    (user) => user.daysUntilBirthday === 0
  );
  const totalCount = upcomingBirthdays.length;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-gray-50 h-8 w-8 lg:h-10 lg:w-10"
          >
            <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
            {totalCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white border-0">
                {totalCount > 9 ? "9+" : totalCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 lg:w-96 p-0 bg-white border border-gray-200 shadow-lg"
          align="end"
        >
          <div className="p-3 lg:p-4 border-b border-gray-200">
            <h3 className="font-semibold flex items-center gap-2 text-gray-900 text-sm lg:text-base">
              <Gift className="w-4 h-4 text-blue-600" />
              {language === "ru" ? "Скоро дни рождения" : "Upcoming Birthdays"}
            </h3>
          </div>
          <ScrollArea className="max-h-80 lg:max-h-96">
            {upcomingBirthdays.length === 0 ? (
              <div className="p-4 lg:p-6 text-center text-gray-500">
                <Calendar className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 text-gray-300" />
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
                        ? "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mt-1">
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={getLocalizedText(user.name, language)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 max-w-[200px] lg:max-w-[250px]">
                      <p className="font-medium text-sm lg:text-base text-gray-900 leading-tight break-all word-wrap overflow-wrap-anywhere hyphens-auto">
                        {getLocalizedText(user.name, language)}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-500 leading-tight break-all word-wrap overflow-wrap-anywhere hyphens-auto">
                        {getLocalizedText(user.position, language)}
                      </p>
                      <div className="flex items-center gap-1 pt-1">
                        <span
                          className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${
                            user.daysUntilBirthday === 0
                              ? "bg-blue-100 text-blue-700"
                              : user.daysUntilBirthday <= 3
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
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
