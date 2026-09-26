"use client";

import React, { useState, useMemo, useRef } from "react";
import { LazyAvatar } from "./lazy-avatar";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { useGroups } from "@/hooks/use-groups";
import { getLocalizedText } from "@/lib/utils";
import type { User } from "@/types";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Wand2,
  Users,
  Building,
  UserCheck,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  UserPlus,
  ArrowUpRight,
  Shield,
  MapPin,
  Mail,
  Phone,
  Check,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrgChartProps {
  users: User[];
  loading?: boolean;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onUpdate?: (user: User) => void;
  onDelete?: (userId: string) => void;
  onReload?: () => void;
}

// Color theme for divisions matching the user's reference image (Blue, Orange, Teal, Purple, etc.)
export const DIVISION_PALETTE = [
  { id: 0, border: "border-[#0284c7]", hex: "#0284c7", bg: "bg-sky-50/50 dark:bg-sky-950/20", text: "text-[#0284c7]" },
  { id: 1, border: "border-[#f97316]", hex: "#f97316", bg: "bg-orange-50/50 dark:bg-orange-950/20", text: "text-[#f97316]" },
  { id: 2, border: "border-[#0d9488]", hex: "#0d9488", bg: "bg-teal-50/50 dark:bg-teal-950/20", text: "text-[#0d9488]" },
  { id: 3, border: "border-[#8b5cf6]", hex: "#8b5cf6", bg: "bg-purple-50/50 dark:bg-purple-950/20", text: "text-[#8b5cf6]" },
  { id: 4, border: "border-[#ec4899]", hex: "#ec4899", bg: "bg-pink-50/50 dark:bg-pink-950/20", text: "text-[#ec4899]" },
];

export function OrgChart({
  users,
  loading = false,
  userRole,
  currentUserId,
  onUpdate,
  onDelete,
  onReload,
}: OrgChartProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { groups } = useGroups();

  // Zoom scale for canvas
  const [zoom, setZoom] = useState(1);
  const [autoBuilding, setAutoBuilding] = useState(false);

  // Modal to change manager / report relationship
  const [editingRelationUser, setEditingRelationUser] = useState<User | null>(null);
  const [selectedNewManagerId, setSelectedNewManagerId] = useState<string>("none");
  const [isSavingRelation, setIsSavingRelation] = useState(false);

  // Edit employee modal
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Map each group ID to a division color
  const groupColorMap = useMemo(() => {
    const map: Record<string, typeof DIVISION_PALETTE[0]> = {};
    groups.forEach((g, idx) => {
      map[g.id] = DIVISION_PALETTE[idx % DIVISION_PALETTE.length];
    });
    return map;
  }, [groups]);

  // Build the hierarchy tree
  const { roots, unassigned, hasHierarchy, divisionLegend } = useMemo(() => {
    const userMap = new Map<string, User>();
    const childrenMap = new Map<string, User[]>();

    users.forEach((u) => {
      userMap.set(u._id, u);
      childrenMap.set(u._id, []);
    });

    let linkedCount = 0;
    const explicitRoots: User[] = [];
    const unlinked: User[] = [];

    users.forEach((u) => {
      if (u.reportsTo && userMap.has(u.reportsTo) && u.reportsTo !== u._id) {
        childrenMap.get(u.reportsTo)!.push(u);
        linkedCount++;
      } else if (u.reportsTo === null || u.reportsTo === "") {
        explicitRoots.push(u);
      } else {
        unlinked.push(u);
      }
    });

    // Check if hierarchy has been established
    const isBuilt = linkedCount > 0 || explicitRoots.length > 0;

    let computedRoots: User[] = [];
    let computedUnassigned: User[] = [];

    if (isBuilt) {
      if (explicitRoots.length > 0) {
        computedRoots = explicitRoots;
        computedUnassigned = unlinked;
      } else {
        // Find top level managers who report to nobody or circular
        const managers = users.filter((u) => u.workerType === "top_manager");
        computedRoots = managers.length > 0 ? [managers[0]] : [users[0]];
        computedUnassigned = users.filter((u) => !computedRoots.includes(u));
      }
    } else {
      // No explicit structure yet: construct a virtual layout from roles & groups so it renders beautifully immediately
      const topManagers = users.filter((u) => u.workerType === "top_manager");
      const rootUser = topManagers.find((u) => u.role === "admin") || topManagers[0] || users[0];

      if (rootUser) {
        computedRoots = [rootUser];
      }
      computedUnassigned = users.filter((u) => u._id !== rootUser?._id);
    }

    // Division official full display names
    const DIVISION_FULL_NAMES: Record<string, string> = {
      mesmer: "MESMER Engineering",
      mesal: "MESAL Water Technologies",
      maxsus: "Maxsus Suv Qurilish Invest",
      prestige_proekt: "Prestige Proekt",
    };

    // Prepare legend list
    const legend = groups.map((g, idx) => ({
      id: g.id,
      label: DIVISION_FULL_NAMES[g.id] || g.label,
      color: DIVISION_PALETTE[idx % DIVISION_PALETTE.length],
    }));

    return {
      roots: computedRoots,
      unassigned: computedUnassigned,
      hasHierarchy: isBuilt,
      childrenMap,
      divisionLegend: legend,
    };
  }, [users, groups]);

  // Handler to auto-organize the hierarchy structure
  const handleAutoOrganize = async () => {
    try {
      setAutoBuilding(true);
      const res = await fetch("/api/users/hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "auto-organize" }),
      });
      if (res.ok) {
        if (onReload) onReload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to auto-organize structure");
      }
    } catch (e) {
      console.error(e);
      alert("Error auto-organizing structure");
    } finally {
      setAutoBuilding(false);
    }
  };

  // Handler to update reportsTo relationship
  const handleSaveRelation = async () => {
    if (!editingRelationUser) return;
    try {
      setIsSavingRelation(true);
      const res = await fetch("/api/users/hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingRelationUser._id,
          reportsTo: selectedNewManagerId === "none" ? null : selectedNewManagerId,
        }),
      });

      if (res.ok) {
        setEditingRelationUser(null);
        if (onReload) onReload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update hierarchy");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving relationship");
    } finally {
      setIsSavingRelation(false);
    }
  };

  // Open modal to change reportsTo
  const openChangeManagerModal = (user: User) => {
    setEditingRelationUser(user);
    setSelectedNewManagerId(user.reportsTo || "none");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm text-slate-500">Loading organization structure...</p>
      </div>
    );
  }

  // Helper to get child nodes of a user
  const getChildren = (userId: string): User[] => {
    return users.filter((u) => u.reportsTo === userId && u._id !== userId);
  };

  return (
    <div className="relative min-h-[700px] flex flex-col bg-slate-50/60 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-hidden">
      {/* Top Bar: Controls & Legend */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 z-20">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-600 dark:text-slate-300"
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              title={t("orgChart.zoomIn")}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-2 tabular-nums text-slate-600 dark:text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-600 dark:text-slate-300"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              title={t("orgChart.zoomOut")}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-600 dark:text-slate-300"
              onClick={() => setZoom(1)}
              title={t("orgChart.resetZoom")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Admin Auto-Build function */}
          {userRole === "admin" && (
            <Button
              size="sm"
              variant="outline"
              disabled={autoBuilding}
              onClick={handleAutoOrganize}
              className="h-9 gap-1.5 text-xs font-medium border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {autoBuilding ? t("orgChart.autoOrganizing") : t("orgChart.autoOrganize")}
            </Button>
          )}
        </div>

        {/* Legend Box in top right - EXACT style as the image */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-3.5 shadow-sm min-w-[210px]">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            {t("orgChart.legend")}
          </p>
          <div className="space-y-1.5">
            {divisionLegend.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <span
                  className="w-5 h-2.5 rounded-sm border-2 shrink-0"
                  style={{ borderColor: item.color.hex }}
                />
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Hierarchy Tree View with Zoom Pan Container */}
      <div className="flex-1 w-full overflow-auto pb-12 pt-4">
        <div
          className="min-w-fit mx-auto transition-transform duration-150 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {roots.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hierarchy nodes found.</p>
              {userRole === "admin" && (
                <Button
                  onClick={handleAutoOrganize}
                  size="sm"
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-1.5" />
                  {t("orgChart.autoOrganize")}
                </Button>
              )}
            </div>
          ) : (
            roots.map((rootUser) => (
              <OrgHierarchyBranch
                key={rootUser._id}
                user={rootUser}
                allUsers={users}
                groupColorMap={groupColorMap}
                userRole={userRole}
                currentUserId={currentUserId}
                onOpenChangeManager={openChangeManagerModal}
                onOpenEdit={setEditingUser}
                level={1}
              />
            ))
          )}

          {/* Unassigned to structure drawer / list if any exist */}
          {unassigned.length > 0 && (
            <div className="mt-16 w-full max-w-4xl border-t-2 border-dashed border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("orgChart.unassigned")}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {unassigned.length}
                  </span>
                </div>
                {userRole === "admin" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAutoOrganize}
                    className="text-xs text-blue-600 dark:text-blue-400"
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1" />
                    {t("orgChart.autoOrganize")}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {unassigned.map((emp) => (
                  <OrgNodeCard
                    key={emp._id}
                    user={emp}
                    groupColorMap={groupColorMap}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    onOpenChangeManager={openChangeManagerModal}
                    onOpenEdit={setEditingUser}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Manager Modal */}
      {editingRelationUser && (
        <Dialog
          open={!!editingRelationUser}
          onOpenChange={(open) => !open && setEditingRelationUser(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {t("orgChart.changeManager")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">
                  {t("form.name")}
                </Label>
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <LazyAvatar
                    src={editingRelationUser.avatar || "/placeholder.svg"}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {getLocalizedText(editingRelationUser.name, language)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getLocalizedText(editingRelationUser.position, language)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {t("form.reportsTo")}
                </Label>
                <Select
                  value={selectedNewManagerId}
                  onValueChange={setSelectedNewManagerId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("form.selectReportsTo")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">
                      <span className="font-semibold text-blue-600">
                        {t("form.noReportsTo")}
                      </span>
                    </SelectItem>
                    {users
                      .filter((u) => u._id !== editingRelationUser._id)
                      .map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          {getLocalizedText(u.name, language)} (
                          {getLocalizedText(u.position, language)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRelationUser(null)}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                size="sm"
                disabled={isSavingRelation}
                onClick={handleSaveRelation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSavingRelation ? t("actions.saving") : t("actions.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Employee Dialog */}
      {editingUser && (
        <EditEmployeeDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onUpdate={(u) => {
            if (onUpdate) onUpdate(u);
            setEditingUser(null);
          }}
          userRole={userRole}
          users={users}
        />
      )}
    </div>
  );
}

/** Recursive Branch rendering matching the exact tree structure from the image */
function OrgHierarchyBranch({
  user,
  allUsers,
  groupColorMap,
  userRole,
  currentUserId,
  onOpenChangeManager,
  onOpenEdit,
  level = 1,
}: {
  user: User;
  allUsers: User[];
  groupColorMap: Record<string, typeof DIVISION_PALETTE[0]>;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onOpenChangeManager: (u: User) => void;
  onOpenEdit: (u: User) => void;
  level: number;
}) {
  // Find immediate children of this node
  const directChildren = useMemo(() => {
    return allUsers.filter((u) => u.reportsTo === user._id && u._id !== user._id);
  }, [allUsers, user._id]);

  const hasChildren = directChildren.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);

  // In the reference image:
  // - Level 1 is CEO (centered at top)
  // - Level 2 is Division Directors (horizontal branch)
  // - Level 3 is Managers (horizontal branch under each director)
  // - Level 4 are Team Members (stacked vertically under each manager with a spine line!)
  const isLeafStack = level >= 3 && directChildren.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <OrgNodeCard
        user={user}
        groupColorMap={groupColorMap}
        userRole={userRole}
        currentUserId={currentUserId}
        onOpenChangeManager={onOpenChangeManager}
        onOpenEdit={onOpenEdit}
        isRoot={level === 1}
        subordinateCount={directChildren.length}
        isExpanded={isExpanded}
        onToggleExpand={hasChildren && isLeafStack ? () => setIsExpanded((prev) => !prev) : undefined}
      />

      {/* If this node has direct children, draw the tree lines */}
      {hasChildren && (
        <>
          {!isLeafStack ? (
            /* Levels 1 & 2: Orthogonal horizontal distribution rail */
            <>
              {/* Vertical stem dropping from bottom of parent card */}
              <div className="w-0.5 h-6 bg-slate-400 dark:bg-slate-500 shrink-0" />

              {/* Children branches rendered side-by-side */}
              <div className="flex items-start justify-center pt-0">
                {directChildren.map((child, index) => {
                  const isFirst = index === 0;
                  const isLast = index === directChildren.length - 1;
                  const isOnly = directChildren.length === 1;

                  return (
                    <div key={child._id} className="relative flex flex-col items-center px-3 sm:px-5">
                      {/* Top horizontal line segment forming continuous distribution bus */}
                      {!isOnly && (
                        <div
                          className={`absolute top-0 h-0.5 bg-slate-400 dark:bg-slate-500 ${
                            isFirst
                              ? "left-1/2 right-0"
                              : isLast
                              ? "left-0 right-1/2"
                              : "left-0 right-0"
                          }`}
                        />
                      )}

                      {/* Vertical line dropping down from horizontal bar into child card */}
                      <div className="w-0.5 h-6 bg-slate-400 dark:bg-slate-500 shrink-0" />

                      <OrgHierarchyBranch
                        user={child}
                        allUsers={allUsers}
                        groupColorMap={groupColorMap}
                        userRole={userRole}
                        currentUserId={currentUserId}
                        onOpenChangeManager={onOpenChangeManager}
                        onOpenEdit={onOpenEdit}
                        level={level + 1}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Level 3+: Manager with team members stacked vertically with left spine connector */
            isExpanded && (
              <div className="relative flex flex-col items-start pl-6 pt-3">
                {/* 1. Vertical line from bottom center of Manager card down 12px */}
                <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-slate-400 dark:bg-slate-500 -translate-x-1/2" />

                {/* 2. Horizontal turn from manager center to the left spine at left: 12px */}
                <div className="absolute top-3 left-3 w-[calc(50%-12px)] h-0.5 bg-slate-400 dark:bg-slate-500" />

                {/* 3. Vertical spine running down from top-3 to center of the last card (bottom: 30px) */}
                <div className="absolute top-3 left-3 bottom-[30px] w-0.5 bg-slate-400 dark:bg-slate-500" />

                {/* 4. Team member cards stacked vertically */}
                <div className="flex flex-col space-y-3">
                  {directChildren.map((child) => (
                    <div key={child._id} className="relative flex items-center">
                      {/* Horizontal branch arm from spine into the card */}
                      <div className="absolute -left-3 w-3 h-0.5 bg-slate-400 dark:bg-slate-500" />
                      <OrgNodeCard
                        user={child}
                        groupColorMap={groupColorMap}
                        userRole={userRole}
                        currentUserId={currentUserId}
                        onOpenChangeManager={onOpenChangeManager}
                        onOpenEdit={onOpenEdit}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

/**
 * Individual Node Card
 * Matches the reference image:
 * - Rounded rectangular box
 * - Border color mapped to division/group
 * - Circular avatar overlapping on the left edge
 * - Name, Role/Position, Division Name
 */
function OrgNodeCard({
  user,
  groupColorMap,
  userRole,
  currentUserId,
  onOpenChangeManager,
  onOpenEdit,
  isRoot = false,
  compact = false,
  subordinateCount,
  isExpanded,
  onToggleExpand,
}: {
  user: User;
  groupColorMap: Record<string, typeof DIVISION_PALETTE[0]>;
  userRole: "admin" | "worker";
  currentUserId?: string;
  onOpenChangeManager: (u: User) => void;
  onOpenEdit: (u: User) => void;
  isRoot?: boolean;
  compact?: boolean;
  subordinateCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const { language } = useLanguage();
  const { groups } = useGroups();
  const { t } = useTranslation();

  const name = getLocalizedText(user.name, language);
  const position = getLocalizedText(user.position, language);

  // Group / Division name and color
  const groupId = user.groups?.[0];
  const groupObj = groups.find((g) => g.id === groupId);

  let groupName = "";
  if (isRoot) {
    groupName = "MESMER Group";
  } else if (groupId === "mesmer") {
    groupName = "MESMER Engineering";
  } else if (groupId === "mesal") {
    groupName = "MESAL Water Technologies";
  } else if (groupId === "maxsus") {
    groupName = "Maxsus Suv Qurilish Invest";
  } else if (groupId === "prestige_proekt") {
    groupName = "Prestige Proekt";
  } else {
    groupName = groupObj?.label || "";
  }

  const colorTheme = (groupId && groupColorMap[groupId]) || DIVISION_PALETTE[0];

  return (
    <div
      className={`group relative flex items-center rounded-xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-150 border-2 select-none ${
        isRoot
          ? "border-slate-800 dark:border-slate-300 min-w-[210px] h-[64px] pl-4 pr-3"
          : `${colorTheme.border} min-w-[200px] max-w-[210px] h-[60px] pl-3 pr-2`
      }`}
    >
      {/* Avatar positioned on the left edge, slightly hanging outside just like the image */}
      <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 shrink-0">
        <LazyAvatar
          src={user.avatar || "/placeholder.svg"}
          alt={name}
          className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs object-cover"
        />
      </div>

      {/* Info Content inside the box */}
      <div className="ml-5 min-w-0 flex-1 py-1 pr-1">
        <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate leading-tight" title={name}>
          {name}
        </p>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5" title={position}>
          {position}
        </p>
        {groupName && (
          <p
            className="text-[10px] font-medium truncate leading-tight mt-0.5"
            style={{ color: isRoot ? undefined : colorTheme.hex }}
          >
            {groupName}
          </p>
        )}
      </div>

      {/* Subordinates count / toggle pill on bottom right */}
      {typeof subordinateCount === "number" && subordinateCount > 0 && onToggleExpand && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="absolute -bottom-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 z-10 transition-transform active:scale-95 cursor-pointer"
          title={isExpanded ? "Collapse team" : "Expand team"}
        >
          <span>{subordinateCount}</span>
          {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        </button>
      )}

      {/* Action Menu (Change Manager / Edit) for Admins */}
      {userRole === "admin" && (
        <div className="shrink-0 -mr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem onClick={() => onOpenChangeManager(user)}>
                <ArrowUpRight className="w-3.5 h-3.5 mr-2 text-blue-600" />
                {t("orgChart.changeManager")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenEdit(user)}>
                <UserCheck className="w-3.5 h-3.5 mr-2 text-slate-600" />
                {t("actions.edit")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
