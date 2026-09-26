"use client";

import { useState, useMemo } from "react";
import { LazyAvatar } from "./lazy-avatar";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EmployeeActionsMenu } from "./employee-card";
import { GroupBadges } from "./group-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { useGroups } from "@/hooks/use-groups";
import { getLocalizedText } from "@/lib/utils";
import type { User } from "@/types";
import {
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrgChartProps {
  users: User[];
  loading?: boolean;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onUpdate?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function OrgChart({
  users,
  loading = false,
  userRole,
  currentUserId,
  onUpdate,
  onDelete,
}: OrgChartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { groups } = useGroups();
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});

  // Partition users into management and work object branches
  const { management, groupedEmployees, unassignedEmployees } = useMemo(() => {
    const managers = users.filter((u) => u.workerType === "top_manager");

    const grouped: Record<string, User[]> = {};
    for (const g of groups) {
      grouped[g.id] = users.filter(
        (u) => u.workerType !== "top_manager" && u.groups?.includes(g.id)
      );
    }

    const unassigned = users.filter(
      (u) =>
        u.workerType !== "top_manager" &&
        (!u.groups || u.groups.length === 0 || !groups.some((g) => u.groups?.includes(g.id)))
    );

    return {
      management: managers,
      groupedEmployees: grouped,
      unassignedEmployees: unassigned,
    };
  }, [users, groups]);

  const toggleBranch = (key: string) => {
    setCollapsedBranches((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => setCollapsedBranches({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = { management: true, unassigned: true };
    for (const g of groups) {
      allCollapsed[g.id] = true;
    }
    setCollapsedBranches(allCollapsed);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const totalHeadcount = users.length;
  const isAllCollapsed =
    collapsedBranches.management &&
    groups.every((g) => collapsedBranches[g.id]) &&
    (unassignedEmployees.length === 0 || collapsedBranches.unassigned);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Banner & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border border-blue-200/60 dark:border-blue-900/40 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("orgChart.title")}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("orgChart.subtitle")}
          </p>
        </div>

        {/* Global Expand/Collapse & Stats */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
            <Users className="w-3.5 h-3.5 inline mr-1 text-blue-600 dark:text-blue-400" />
            {totalHeadcount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={isAllCollapsed ? expandAll : collapseAll}
            className="text-xs border-slate-300 dark:border-slate-700 dark:bg-slate-900"
          >
            {isAllCollapsed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
                {t("orgChart.expandAll")}
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 mr-1.5" />
                {t("orgChart.collapseAll")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* TOP TIER: MANAGEMENT / LEADERSHIP */}
      <div className="relative rounded-2xl border-2 border-blue-500/30 dark:border-blue-500/20 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-blue-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {t("orgChart.management")}
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  {management.length}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t("sidebar.topManagers")}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleBranch("management")}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400"
          >
            {collapsedBranches.management ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>

        {!collapsedBranches.management && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {management.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">
                {t("orgChart.noEmployeesInGroup")}
              </p>
            ) : (
              management.map((manager) => (
                <OrgPersonCard
                  key={manager._id}
                  user={manager}
                  userRole={userRole}
                  currentUserId={currentUserId}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  isManagement
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Visual Tree Connector Line */}
      <div className="flex justify-center -my-4 relative z-0">
        <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-slate-300 dark:to-slate-700" />
      </div>

      {/* SECOND TIER: WORK OBJECTS / BRANCHES */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("orgChart.objectsAndBranches")}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {groups.map((group) => {
            const branchUsers = groupedEmployees[group.id] || [];
            const isCollapsed = !!collapsedBranches[group.id];

            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 overflow-hidden"
              >
                {/* Branch Header */}
                <div
                  onClick={() => toggleBranch(group.id)}
                  className="flex items-center justify-between p-4 sm:px-6 cursor-pointer select-none bg-slate-50/70 hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200/60 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {group.label}
                        </h4>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 tabular-nums">
                          {branchUsers.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {isCollapsed ? t("actions.expand") || "Развернуть" : t("actions.collapse") || "Свернуть"}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Branch Members */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-6 bg-white dark:bg-slate-900">
                    {branchUsers.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-2 text-center">
                        {t("orgChart.noEmployeesInGroup")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {branchUsers.map((user) => (
                          <OrgPersonCard
                            key={user._id}
                            user={user}
                            userRole={userRole}
                            currentUserId={currentUserId}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned Staff Branch if any exist */}
          {unassignedEmployees.length > 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
              <div
                onClick={() => toggleBranch("unassigned")}
                className="flex items-center justify-between p-4 sm:px-6 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-800/20 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                      {t("orgChart.unassigned")}
                    </h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {unassignedEmployees.length}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                  {collapsedBranches.unassigned ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {!collapsedBranches.unassigned && (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {unassignedEmployees.map((user) => (
                      <OrgPersonCard
                        key={user._id}
                        user={user}
                        userRole={userRole}
                        currentUserId={currentUserId}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Individual Employee Card Inside the Hierarchy Tree */
function OrgPersonCard({
  user,
  userRole,
  currentUserId,
  onUpdate,
  onDelete,
  isManagement = false,
}: {
  user: User;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onUpdate?: (user: User) => void;
  onDelete?: (userId: string) => void;
  isManagement?: boolean;
}) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const name = getLocalizedText(user.name, language);
  const position = getLocalizedText(user.position, language);

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
          isManagement
            ? "border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-800/90 hover:border-blue-400 dark:hover:border-blue-600"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <div>
          {/* Top row: Avatar + Name/Role + Admin Menu */}
          <div className="flex items-start gap-3">
            <LazyAvatar
              src={user.avatar || "/placeholder.svg"}
              alt={name}
              className={`w-11 h-11 shrink-0 rounded-full ring-2 ${
                isManagement
                  ? "ring-blue-500/40 dark:ring-blue-400/40"
                  : "ring-slate-200 dark:ring-slate-700"
              }`}
            />
            <div className="min-w-0 flex-1">
              <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate" title={name}>
                {name}
              </h5>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate mt-0.5" title={position}>
                {position}
              </p>
            </div>

            {userRole === "admin" && onUpdate && onDelete && (
              <div className="shrink-0 -mr-1">
                <EmployeeActionsMenu
                  onEdit={() => setShowEditDialog(true)}
                  onDelete={() => onDelete(user._id)}
                  canDelete={currentUserId !== user._id}
                />
              </div>
            )}
          </div>

          {/* Location / Cabinet Badge */}
          {user.room && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 px-2 py-1 rounded-md w-fit" title={t("form.room")}>
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{user.room}</span>
            </div>
          )}
        </div>

        {/* Contact Quick Actions Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <a
            href={`mailto:${user.email}`}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[130px]"
            title={user.email}
          >
            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{user.email}</span>
          </a>
          <a
            href={`tel:${user.phone}`}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-2 shrink-0 font-medium"
            title={user.phone}
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.phone}</span>
          </a>
        </div>
      </div>

      {userRole === "admin" && onUpdate && (
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
