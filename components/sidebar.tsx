"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  LogOut,
  Settings,
  Home,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ProfileSettings } from "./profile-settings";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import type { User, MultiLanguageText } from "@/types";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  selectedSection: string;
  onSectionChange: (section: string) => void;
  userRole: "admin" | "worker";
  currentUser?: User;
  onUserUpdate?: (user: User) => void;
}

export function Sidebar({
  selectedSection,
  onSectionChange,
  userRole,
  currentUser,
  onUserUpdate,
}: SidebarProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Функция для получения локализованного текста
  const getLocalizedText = (
    text: string | MultiLanguageText | undefined | null
  ): string => {
    if (!text) return "";
    if (typeof text === "string") return text; // Поддержка старого формата
    return text[language] || text.ru || text.en || "";
  };

  const handleProfileUpdate = (updatedUser: User) => {
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  // Determine which sections to show based on permissions
  const showTopManagers =
    userRole === "admin" ||
    (currentUser?.viewPermissions &&
      (currentUser.viewPermissions === "top_managers" ||
        currentUser.viewPermissions === "both"));

  const showEmployees =
    userRole === "admin" ||
    (currentUser?.viewPermissions &&
      (currentUser.viewPermissions === "employees" ||
        currentUser.viewPermissions === "both"));

  // Получаем локализованное имя пользователя
  const userName = getLocalizedText(session?.user?.name);
  // Получаем первую букву имени для аватара
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <div
      className={cn(
        "bg-white shadow-lg border-r border-gray-200 flex flex-col h-full transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        {!collapsed && (
          <div className="flex items-center">
            <div className=" rounded-md p-1 mr-2">
              <Image
                src="/mesmerlogo1.svg"
                alt="Mesmer Logo"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto  rounded-md p-1">
            <Image
              src="/favicon.ico"
              alt="Mesmer Logo"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-700 lg:flex hidden items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100"
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              collapsed ? "" : "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 px-2">
        <div className="space-y-1">
          <TooltipProvider>
            {showTopManagers && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSectionChange("top_managers")}
                    className={cn(
                      "flex items-center w-full px-3 py-2.5 text-left rounded-lg transition-colors",
                      selectedSection === "top_managers"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600",
                      collapsed ? "justify-center" : ""
                    )}
                  >
                    <UserCheck
                      className={cn("w-5 h-5", collapsed ? "" : "mr-3")}
                    />
                    {!collapsed && (
                      <span className="font-medium text-sm">
                        {t("sidebar.topManagers")}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {t("sidebar.topManagers")}
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            {showEmployees && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSectionChange("employees")}
                    className={cn(
                      "flex items-center w-full px-3 py-2.5 text-left rounded-lg transition-colors",
                      selectedSection === "employees"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600",
                      collapsed ? "justify-center" : ""
                    )}
                  >
                    <Users className={cn("w-5 h-5", collapsed ? "" : "mr-3")} />
                    {!collapsed && (
                      <span className="font-medium text-sm">
                        {t("sidebar.employees")}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {t("sidebar.employees")}
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            {/* Additional navigation items */}
          </TooltipProvider>
        </div>
      </nav>

      {/* User Profile Section */}
      <div
        className={cn("border-t border-gray-200", collapsed ? "p-2" : "p-4")}
      >
        {session && (
          <div className="mb-3">
            <div
              className={cn(
                "flex items-center bg-gray-50 rounded-lg border p-2",
                collapsed ? "justify-center" : "space-x-3"
              )}
            >
              <Avatar
                className={cn(
                  "bg-blue-600 ",
                  collapsed ? "w-10 h-10" : "w-12 h-12"
                )}
              >
                <AvatarImage
                  src={currentUser?.avatar || ""}
                  alt={getLocalizedText(currentUser?.name)}
                  className="object-contain"
                />
                <AvatarFallback className="bg-blue-600 text-white">
                  {userInitial}
                </AvatarFallback>
              </Avatar>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getLocalizedText(session.user?.name)}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {t(`roles.${userRole}`)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Settings Button */}
        <TooltipProvider>
          {currentUser && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setShowProfileSettings(true)}
                  className={cn(
                    "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 text-sm mb-2",
                    collapsed ? "w-full p-2 justify-center" : "w-full"
                  )}
                >
                  <Settings
                    className={cn("w-4 h-4", collapsed ? "" : "mr-2")}
                  />
                  {!collapsed && t("profile.settings")}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {t("profile.settings")}
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Logout Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className={cn(
                  "border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 text-sm",
                  collapsed ? "w-full p-2 justify-center" : "w-full"
                )}
              >
                <LogOut className={cn("w-4 h-4", collapsed ? "" : "mr-2")} />
                {!collapsed && t("sidebar.logout")}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                {t("sidebar.logout")}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Profile Settings Dialog */}
      {currentUser && (
        <ProfileSettings
          open={showProfileSettings}
          onOpenChange={setShowProfileSettings}
          user={currentUser}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
