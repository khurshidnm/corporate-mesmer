"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  LogOut,
  Settings,
  Home,
  Calendar,
  ChevronRight,
  Layers,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ProfileSettings } from "./profile-settings";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import type { User, MultiLanguageText } from "@/types";
import Image from "next/image";
import { MesmerLogo } from "@/components/mesmer-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { GROUP_SECTION_PREFIX } from "@/lib/groups";
import { useGroups } from "@/hooks/use-groups";
import { ManageGroupsDialog } from "./manage-groups-dialog";
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
  users?: User[];
}

export function Sidebar({
  selectedSection,
  onSectionChange,
  userRole,
  currentUser,
  onUserUpdate,
  users = [],
}: SidebarProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { groups, isSuperAdmin } = useGroups();

  // Compute user counts for each menu section and work object
  const userCounts = useMemo(() => {
    const topManagers = users.filter((u) => u.workerType === "top_manager").length;
    const employees = users.filter(
      (u) => u.workerType === "employee" || u.role === "admin"
    ).length;
    const groupCounts: Record<string, number> = {};
    for (const g of groups) {
      groupCounts[g.id] = users.filter((u) => u.groups?.includes(g.id)).length;
    }
    return {
      topManagers,
      employees,
      groupCounts,
    };
  }, [users, groups]);

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
        "flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[8px_0_28px_rgba(15,23,42,0.04)] transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
        {!collapsed && (
          <div className="flex items-center">
            <div className="rounded-md p-1 mr-2">
              <MesmerLogo className="h-8 w-auto max-w-[170px]" />
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
          className="hidden h-7 w-7 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:flex"
          aria-label="Toggle sidebar"
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
      <nav className="mt-6 flex-1 px-3">
        <div className="space-y-1">
          <TooltipProvider>
            {showTopManagers && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSectionChange("top_managers")}
                    className={cn(
                      "group flex w-full items-center rounded-md px-3 py-2.5 text-left transition-colors",
                      selectedSection === "top_managers"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400",
                      collapsed ? "justify-center" : ""
                    )}
                  >
                    <UserCheck
                      className={cn("w-5 h-5 shrink-0", collapsed ? "" : "mr-3")}
                    />
                    {!collapsed && (
                      <>
                        <span className="font-medium text-sm flex-1 truncate">
                          {t("sidebar.topManagers")}
                        </span>
                        <span
                          className={cn(
                            "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums transition-colors",
                            selectedSection === "top_managers"
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200"
                          )}
                        >
                          {userCounts.topManagers}
                        </span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {t("sidebar.topManagers")} ({userCounts.topManagers})
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
                      "group flex w-full items-center rounded-md px-3 py-2.5 text-left transition-colors",
                      selectedSection === "employees"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400",
                      collapsed ? "justify-center" : ""
                    )}
                  >
                    <Users className={cn("w-5 h-5 shrink-0", collapsed ? "" : "mr-3")} />
                    {!collapsed && (
                      <>
                        <span className="font-medium text-sm flex-1 truncate">
                          {t("sidebar.employees")}
                        </span>
                        <span
                          className={cn(
                            "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums transition-colors",
                            selectedSection === "employees"
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200"
                          )}
                        >
                          {userCounts.employees}
                        </span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {t("sidebar.employees")} ({userCounts.employees})
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            {/* Employee groups / Work Objects */}
            {!collapsed && (
              <div className="flex items-center justify-between px-3 pt-3 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("sidebar.groups") || "Объекты"}
                </span>
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowManageGroups(true)}
                    className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t("groups.manage") || "Управление группами"}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {collapsed && isSuperAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowManageGroups(true)}
                    className="flex w-full items-center justify-center rounded-md px-3 py-2 text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t("groups.manage") || "Управление группами"}
                </TooltipContent>
              </Tooltip>
            )}

            {groups.map((group) => {
              const section = `${GROUP_SECTION_PREFIX}${group.id}`;
              const isSelected = selectedSection === section;
              const groupCount = userCounts.groupCounts[group.id] || 0;
              return (
                <Tooltip key={group.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSectionChange(section)}
                      className={cn(
                        "group flex w-full items-center rounded-md px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400",
                        collapsed ? "justify-center" : ""
                      )}
                    >
                      <Layers
                        className={cn("w-5 h-5 shrink-0", collapsed ? "" : "mr-3")}
                      />
                      {!collapsed && (
                        <>
                          <span className="font-medium text-sm flex-1 truncate">
                            {group.label}
                          </span>
                          <span
                            className={cn(
                              "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums transition-colors",
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200"
                            )}
                          >
                            {groupCount}
                          </span>
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {group.label} ({groupCount})
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </nav>

      {/* User Profile Section */}
      <div
        className={cn("border-t border-gray-200 dark:border-slate-800", collapsed ? "p-2" : "p-4")}
      >
        {session && (
          <div className="mb-3">
            <div
              className={cn(
                "flex items-center bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/70 p-2",
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
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                    {getLocalizedText(session.user?.name)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
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
                    "border-gray-300 dark:border-slate-700 dark:bg-slate-800/60 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 text-sm mb-2",
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
                  "border-gray-300 dark:border-slate-700 dark:bg-slate-800/60 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 text-sm",
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

      {/* Super Admin Groups Management Dialog */}
      {isSuperAdmin && (
        <ManageGroupsDialog
          open={showManageGroups}
          onOpenChange={setShowManageGroups}
        />
      )}
    </div>
  );
}
