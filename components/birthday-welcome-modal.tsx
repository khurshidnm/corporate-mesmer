"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Calendar, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { getLocalizedText } from "@/lib/utils";
import type { BirthdayUser } from "@/types";

interface BirthdayWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BirthdayWelcomeModal({
  open,
  onOpenChange,
}: BirthdayWelcomeModalProps) {
  const [birthdayUsers, setBirthdayUsers] = useState<BirthdayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { language } = useLanguage();

  useEffect(() => {
    if (open) {
      fetchBirthdayUsers();
    }
  }, [open]);

  useEffect(() => {
    fetchBirthdayUsers();
  }, []);

  const fetchBirthdayUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/upcoming-birthdays?days=0");
      if (response.ok) {
        const data = await response.json();
        setBirthdayUsers(data);
        console.log(data);
      }
    } catch (error) {
      console.error("Error fetching birthday users:", error);
    } finally {
      setLoading(false);
    }
  };

  const todayBirthdays = birthdayUsers.filter(
    (user) => user.daysUntilBirthday === 0
  );
  const upcomingBirthdays = birthdayUsers.filter(
    (user) => user.daysUntilBirthday > 0 && user.daysUntilBirthday <= 7
  );

  const formatDaysUntilBirthday = (days: number) => {
    if (days === 0) return t("birthday.today");
    if (days === 1) return t("birthday.tomorrow");
    return t("birthday.inDays", { days });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (birthdayUsers.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white">
        {/* Header */}
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-2xl font-bold text-blue-600 break-words">
            🎉 {t("birthday.welcomeTitle")} 🎉
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2 break-words">
            {t("birthday.welcomeSubtitle")}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Today's Birthdays */}
          {todayBirthdays.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-blue-600 break-words">
                  {t("birthday.todayBirthdays")}
                </h3>
              </div>
              <div className="space-y-3">
                {todayBirthdays.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12 ring-2 ring-blue-300">
                        <AvatarImage
                          src={user.avatar || "/placeholder.svg"}
                          alt={getLocalizedText(user.name, language)}
                        />
                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                          {getLocalizedText(user.name, language)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🎂</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-semibold text-gray-900 leading-tight break-words">
                        {getLocalizedText(user.name, language)}
                      </p>
                      <p className="text-sm text-gray-600 leading-tight break-words">
                        {getLocalizedText(user.position, language)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className="bg-blue-600 text-white whitespace-nowrap">
                        {formatDaysUntilBirthday(user.daysUntilBirthday)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Birthdays This Week */}
          {upcomingBirthdays.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-blue-600 break-words">
                  {t("birthday.upcomingThisWeek")}
                </h3>
              </div>
              <div className="space-y-3">
                {upcomingBirthdays.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="w-12 h-12 ring-2 ring-gray-300">
                        <AvatarImage
                          src={user.avatar || "/placeholder.svg"}
                          alt={getLocalizedText(user.name, language)}
                        />
                        <AvatarFallback className="bg-gray-600 text-white font-bold">
                          {getLocalizedText(user.name, language)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-semibold text-gray-900 leading-tight break-words">
                        {getLocalizedText(user.name, language)}
                      </p>
                      <p className="text-sm text-gray-600 leading-tight break-words">
                        {getLocalizedText(user.position, language)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className="bg-gray-600 text-white whitespace-nowrap">
                        {formatDaysUntilBirthday(user.daysUntilBirthday)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-700 font-medium break-words leading-relaxed">
              {t("birthday.dontForgetMessage")}
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              <X className="w-4 h-4 mr-2" />
              {t("birthday.gotIt")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
