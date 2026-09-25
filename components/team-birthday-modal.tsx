"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { getLocalizedText } from "@/lib/utils";
import type { BirthdayUser } from "@/types";
import { LazyAvatar } from "./lazy-avatar";
import {
  BirthdayConfetti,
  FestiveRing,
  FloatingDecorations,
} from "./birthday-fx";

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
  const { language } = useLanguage();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [burst, setBurst] = useState(0);

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

  // 2-3 people are listed together; one (or a carousel of many) gets the hero layout
  const showList = users.length >= 2 && users.length <= 3;
  const heroUser = users[currentUserIndex] ?? users[0];

  const ru = language === "ru";
  const celebrantsLabel = ru
    ? `${users.length} ${users.length < 5 ? "именинника" : "именинников"}`
    : `${users.length} people celebrating`;

  // Closing with a fresh confetti burst so the celebration spills onto the page
  const congratulate = () => {
    setBurst((b) => b + 1);
    onOpenChange(false);
  };

  return (
    <>
      <BirthdayConfetti active={open} burst={burst} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`${
            showList ? "sm:max-w-lg" : "sm:max-w-md"
          } overflow-hidden border-0 bg-white dark:bg-slate-900 p-0 shadow-2xl [&>button]:text-white [&>button]:opacity-80`}
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 px-6 pb-8 pt-8 text-center text-white">
            <FloatingDecorations />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 shadow-lg ring-4 ring-white/30 backdrop-blur animate-pop-in">
                <span className="text-4xl animate-wiggle motion-reduce:animate-none">
                  🎂
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight animate-pop-in [animation-delay:120ms]">
                {ru ? "С Днём Рождения!" : "Happy Birthday!"}
              </DialogTitle>
              <p className="mt-1 text-sm text-white/85">
                {ru ? "Сегодня особенный день" : "Today is a special day"}
              </p>
              {users.length > 1 && (
                <span className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
                  🎉 {celebrantsLabel}
                </span>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="p-5">
            {showList ? (
              <div className="mb-4 max-h-64 space-y-4 overflow-y-auto">
                {users.map((user, index) => (
                  <div
                    key={user._id || index}
                    className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <FestiveRing>
                      <LazyAvatar
                        src={user.avatar || "/placeholder.svg"}
                        alt={getLocalizedText(user.name, language)}
                        className="h-14 w-14 rounded-full"
                      />
                    </FestiveRing>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-tight text-gray-900 dark:text-slate-100 break-words">
                        {getLocalizedText(user.name, language)}
                      </h3>
                      <p className="text-sm leading-tight text-gray-500 dark:text-slate-400 break-words">
                        {getLocalizedText(user.position, language)}
                      </p>
                    </div>
                    <span className="shrink-0 text-2xl">🎉</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                key={heroUser._id}
                className="mb-4 flex flex-col items-center text-center animate-in fade-in slide-in-from-right-4 duration-500"
              >
                <div className="relative">
                  <FestiveRing>
                    <LazyAvatar
                      src={heroUser.avatar || "/placeholder.svg"}
                      alt={getLocalizedText(heroUser.name, language)}
                      className="h-28 w-28 rounded-full"
                    />
                  </FestiveRing>
                  <span className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-xl shadow-md ring-2 ring-pink-100 dark:ring-pink-900/60 animate-bounce motion-reduce:animate-none">
                    🎉
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-tight text-gray-900 dark:text-slate-100 break-words">
                  {getLocalizedText(heroUser.name, language)}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 break-words">
                  {getLocalizedText(heroUser.position, language)}
                </p>
              </div>
            )}

            {/* Congratulatory message */}
            <div className="mb-4 rounded-lg border border-blue-100 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 via-indigo-50 to-fuchsia-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-fuchsia-950/40 p-3">
              <p className="text-center text-sm leading-relaxed text-gray-700 dark:text-slate-200 break-words">
                {showList ? (
                  ru ? (
                    <>Поздравляем наших коллег с днём рождения! 🎉</>
                  ) : (
                    <>Congratulations to our colleagues on their birthdays! 🎉</>
                  )
                ) : (
                  <>
                    {ru ? "Сегодня у" : "Today is"}{" "}
                    <span className="font-semibold break-words">
                      {getLocalizedText(heroUser.name, language)}
                    </span>{" "}
                    {ru ? "день рождения!" : "birthday!"}
                  </>
                )}
              </p>
            </div>

            {/* Carousel indicator (more than 3 people) */}
            {users.length > 3 && (
              <div className="mb-4 flex justify-center space-x-1.5">
                {users.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentUserIndex
                        ? "w-5 bg-blue-600"
                        : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}

            <Button
              onClick={congratulate}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:from-blue-700 hover:to-indigo-700"
            >
              <Gift className="mr-2 h-4 w-4" />
              {ru ? "Поздравить" : "Congratulate"}
            </Button>

            {users.length > 3 && (
              <p className="mt-3 text-center text-xs text-gray-500 break-words">
                {ru
                  ? `Всего ${users.length} именинников сегодня`
                  : `Total ${users.length} people celebrating today`}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
