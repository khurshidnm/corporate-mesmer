"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Cake, Calendar } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { getLocalizedText } from "@/lib/utils";
import type { BirthdayUser } from "@/types";
import { LazyAvatar } from "./lazy-avatar";

interface TeamBirthdayModalProps {
  users: BirthdayUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamBirthdayModal({
  users,
  open,
  onOpenChange,
}: TeamBirthdayModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Reset current user index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentUserIndex(0);
    }
  }, [open]);

  // Auto-switch between users only if there are more than 3
  useEffect(() => {
    if (users.length > 3 && open) {
      const interval = setInterval(() => {
        setCurrentUserIndex((prev) => (prev + 1) % users.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [users.length, open]);

  if (!users.length) return null;

  // Show multiple users in column if 2-3 users, otherwise show carousel
  const showMultipleUsers = users.length >= 2 && users.length <= 3;
  const displayUsers = showMultipleUsers ? users : [users[currentUserIndex]];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          showMultipleUsers ? "sm:max-w-lg" : "sm:max-w-md"
        } bg-white p-0 overflow-hidden`}
      >
        {/* Header */}
        <div className="bg-blue-50 p-4 text-center border-b border-blue-100">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-100 rounded-full p-2">
              <Cake className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-900">
            {language === "ru" ? "День Рождения" : "Birthday"}
          </h2>
          <p className="text-sm text-gray-600">
            {language === "ru"
              ? "Сегодня особенный день"
              : "Today is a special day"}
          </p>
          {users.length > 1 && (
            <p className="text-xs text-blue-600 mt-1">
              {language === "ru"
                ? `${users.length} ${
                    users.length === 2
                      ? "именинника"
                      : users.length < 5
                      ? "именинника"
                      : "именинников"
                  }`
                : `${users.length} ${
                    users.length === 1 ? "person" : "people"
                  } celebrating`}
            </p>
          )}
        </div>

        {/* Main content */}
        <div className="p-5">
          {/* Birthday people info */}
          <div
            className={`space-y-4 mb-4 ${
              showMultipleUsers ? "max-h-64 overflow-y-auto" : ""
            }`}
          >
            {displayUsers.map((user, index) => (
              <div
                key={user._id || index}
                className="flex items-start space-x-4"
              >
                <LazyAvatar
                  src={user.avatar || "/placeholder.svg"}
                  alt={getLocalizedText(user.name, language)}
                  className="w-16 h-16 rounded-full border border-gray-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-medium text-gray-900 leading-tight break-words">
                    {getLocalizedText(user.name, language)}
                  </h3>
                  <p className="text-sm text-gray-500 leading-tight break-words">
                    {getLocalizedText(user.position, language)}
                  </p>
                  {showMultipleUsers && (
                    <div className="flex items-center mt-1">
                      <Calendar className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" />
                      <span className="text-xs text-blue-600">
                        {language === "ru" ? "Сегодня" : "Today"}
                      </span>
                    </div>
                  )}
                </div>
                {showMultipleUsers && (
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 rounded-full p-1">
                      <Gift className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Congratulatory message */}
          <div className="bg-gray-50 rounded p-3 mb-4 border border-gray-100">
            <p className="text-gray-700 text-sm text-center leading-relaxed break-words">
              {showMultipleUsers ? (
                language === "ru" ? (
                  <>Поздравляем наших коллег с днём рождения! 🎉</>
                ) : (
                  <>Congratulations to our colleagues on their birthdays! 🎉</>
                )
              ) : (
                <>
                  {language === "ru" ? "Сегодня у" : "Today is"}{" "}
                  <span className="font-medium break-words">
                    {getLocalizedText(displayUsers[0].name, language)}
                  </span>{" "}
                  {language === "ru" ? "день рождения!" : "birthday!"}
                </>
              )}
            </p>
          </div>

          {/* Multiple birthday people indicator for carousel (more than 3 users) */}
          {users.length > 3 && (
            <div className="flex justify-center space-x-1 mb-4">
              {users.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentUserIndex ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Buttons */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Gift className="w-4 h-4 mr-2" />
            {language === "ru" ? "Поздравить" : "Congratulate"}
          </Button>

          {/* Additional info for many users */}
          {users.length > 3 && (
            <p className="text-xs text-center text-gray-500 mt-3 break-words">
              {language === "ru"
                ? `Всего ${users.length} именинников сегодня`
                : `Total ${users.length} people celebrating today`}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
