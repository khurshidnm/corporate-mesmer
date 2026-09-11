"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { BirthdayUser } from "@/types";

interface MultiLanguageText {
  ru: string;
  en: string;
}

interface BirthdayNotificationProps {
  users: BirthdayUser[];
  onClose: () => void;
}

export function BirthdayNotification({
  users,
  onClose,
}: BirthdayNotificationProps) {
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // Auto close after 10 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getLocalizedText = (
    text: string | MultiLanguageText | undefined | null
  ): string => {
    if (!text) return "";

    // Если это строка (старый формат), возвращаем как есть
    if (typeof text === "string") {
      return text;
    }

    // Если это объект с языками, выбираем нужный язык
    if (typeof text === "object" && text !== null) {
      return text[language] || text.ru || text.en || "";
    }

    return "";
  };

  const getTranslation = (key: string): string => {
    const translations = {
      "birthday.title": language === "ru" ? "День рождения" : "Birthday",
      "birthday.message":
        language === "ru"
          ? "Не забудьте поздравить именинников!"
          : "Don't forget to congratulate the birthday celebrants!",
    };

    return translations[key as keyof typeof translations] || key;
  };

  console.log("BirthdayNotification users:", users);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-blue-800">
                🎉 {getTranslation("birthday.title")} 🎉
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={user.avatar || "/placeholder.svg"}
                  alt={getLocalizedText(user.name)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {getLocalizedText(user.name)}
                </h4>
                <Badge
                  variant="secondary"
                  className="text-xs text-blue-600 bg-blue-50"
                >
                  {getLocalizedText(user.position)}
                </Badge>
              </div>
              <div className="text-2xl">🎂</div>
            </div>
          ))}
          <p className="text-center text-sm text-blue-600 mt-4">
            {getTranslation("birthday.message")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
