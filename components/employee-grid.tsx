"use client";

import { useState, useMemo, useEffect } from "react";
import { EmployeeCard, EmployeeCardSkeleton } from "./employee-card";
import { EmployeeTable } from "./employee-table";
import { AddEmployeeDialog } from "./add-employee-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ArrowUpDown,
  Hash,
  Cake,
  UserIcon,
  Building,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { getLocalizedText } from "@/lib/utils";
import { daysUntilBirthday } from "@/lib/birthday";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User, CreateUserData, MultiLanguageText } from "@/types";

interface EmployeeGridProps {
  users: User[];
  /** True until the directory has been fetched; skeleton cards are shown meanwhile */
  loading?: boolean;
  userRole: "admin" | "worker";
  currentUserId?: string;
  currentUser?: User;
  onReload: () => void;
}

const SKELETON_COUNT = 10;

type ViewMode = "cards" | "table";
const VIEW_STORAGE_KEY = "employeeView";

export function EmployeeGrid({
  users,
  loading = false,
  userRole,
  currentUserId,
  currentUser,
  onReload,
}: EmployeeGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sortBy, setSortBy] = useState("order_id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [previousSort, setPreviousSort] = useState({
    by: "order_id",
    order: "asc",
  });
  const [birthdayFilterActive, setBirthdayFilterActive] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHiddenUsers, setShowHiddenUsers] = useState(false);
  const [view, setView] = useState<ViewMode>("cards");
  const { t } = useTranslation();

  // Remembered per browser, like the language choice
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_STORAGE_KEY) === "table") setView("table");
    } catch {}
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {}
  };
  const { language } = useLanguage();

  const getSearchableText = (
    text: string | MultiLanguageText | undefined
  ): string => {
    if (!text) return "";
    if (typeof text === "string") return text; // Поддержка старого формата
    if (typeof text === "object") {
      // Объединяем все языковые версии для поиска
      return [text.ru, text.en].filter(Boolean).join(" ");
    }
    return "";
  };

  // Permission filter -> hidden/search filter -> sort, all on the client: the
  // whole directory is only ~150 people, so this is instant and needs no
  // round trip.
  const visibleUsers = useMemo(() => {
    let result = users;

    // Admin can see everyone; workers only what their viewPermissions allow
    if (userRole !== "admin") {
      if (!currentUser) return [];
      const { viewPermissions } = currentUser;
      result = result.filter((user) => {
        if (user.role === "admin") return true; // Always show admins to everyone
        if (viewPermissions === "both") return true;
        if (viewPermissions === "top_managers")
          return user.workerType === "top_manager";
        if (viewPermissions === "employees")
          return user.workerType === "employee";
        return false;
      });
    }

    const searchLower = searchTerm.trim().toLowerCase();
    result = result.filter((user) => {
      if (user.hidden && !showHiddenUsers) return false;
      if (!searchLower) return true;
      return (
        getSearchableText(user?.name).toLowerCase().includes(searchLower) ||
        getSearchableText(user?.position).toLowerCase().includes(searchLower) ||
        getSearchableText(user?.object_name)
          .toLowerCase()
          .includes(searchLower) ||
        user?.email?.toLowerCase().includes(searchLower)
      );
    });

    // Birthday mode only makes sense for people with a valid birthday
    if (sortBy === "birthday") {
      result = result.filter((user) => daysUntilBirthday(user.birthday) !== null);
    }

    const collator = new Intl.Collator([language, "ru", "en"], {
      sensitivity: "base",
    });
    const byText = (pick: (u: User) => MultiLanguageText | string | undefined) =>
      (a: User, b: User) =>
        collator.compare(
          getLocalizedText(pick(a), language),
          getLocalizedText(pick(b), language)
        );

    const compare: (a: User, b: User) => number =
      sortBy === "name"
        ? byText((u) => u.name)
        : sortBy === "position"
        ? byText((u) => u.position)
        : sortBy === "object_name"
        ? byText((u) => u.object_name)
        : sortBy === "birthday"
        ? (a, b) =>
            (daysUntilBirthday(a.birthday) ?? 0) -
            (daysUntilBirthday(b.birthday) ?? 0)
        : (a, b) =>
            (a.order_id ?? 0) - (b.order_id ?? 0) ||
            Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "");

    const direction = sortOrder === "desc" ? -1 : 1;
    return [...result].sort((a, b) => direction * compare(a, b));
  }, [users, userRole, currentUser, searchTerm, showHiddenUsers, sortBy, sortOrder, language]);

  const handleAddUser = async (newUser: CreateUserData) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        onReload();
      } else {
        const error = await response.json();
        alert(error.error || t("errors.failedToAddUser"));
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert(t("errors.failedToAddUser"));
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const response = await fetch(`/api/users/${updatedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        onReload();
      } else {
        const error = await response.json();
        alert(error.error || t("errors.failedToUpdateUser"));
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert(t("errors.failedToUpdateUser"));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("confirmations.deleteUser"))) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onReload();
      } else {
        const error = await response.json();
        alert(error.error || t("errors.failedToDeleteUser"));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(t("errors.failedToDeleteUser"));
    }
  };

  const handleSortChange = (newSortBy: string) => {
    // Если включаем не birthday сортировку, отключаем birthday фильтр
    if (newSortBy !== "birthday") {
      setBirthdayFilterActive(false);
    }

    setSortBy(newSortBy);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleBirthdayFilter = () => {
    if (!birthdayFilterActive) {
      // Сохраняем текущую сортировку перед включением фильтра по дням рождения
      setPreviousSort({ by: sortBy, order: sortOrder });

      // Включаем фильтр по дням рождения
      setBirthdayFilterActive(true);
      setSortBy("birthday");
      setSortOrder("asc");
    } else {
      // Отключаем фильтр и возвращаемся к предыдущей сортировке
      setBirthdayFilterActive(false);
      setSortBy(previousSort.by);
      setSortOrder(previousSort.order);
    }
  };

  const ViewToggle = () => (
    <div
      role="group"
      aria-label={t("view.label")}
      className="flex shrink-0 rounded-md border border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5"
    >
      {(
        [
          ["cards", LayoutGrid, t("view.cards")],
          ["table", List, t("view.table")],
        ] as const
      ).map(([mode, Icon, label]) => (
        <button
          key={mode}
          type="button"
          onClick={() => changeView(mode)}
          aria-pressed={view === mode}
          aria-label={label}
          title={label}
          className={`flex h-8 w-9 items-center justify-center rounded transition-colors ${
            view === mode
              ? "bg-blue-600 text-white"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );

  const FilterControls = () => (
    <div className="space-y-4">
      {userRole === "admin" && (
        <div className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2.5">
          <Label htmlFor="showHiddenUsers" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("filters.showHiddenUsers")}
          </Label>
          <Switch
            id="showHiddenUsers"
            checked={showHiddenUsers}
            onCheckedChange={setShowHiddenUsers}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Select
          value={sortBy}
          onValueChange={handleSortChange}
          disabled={birthdayFilterActive}
        >
          <SelectTrigger
            className={`flex-1 border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
              birthdayFilterActive ? "opacity-50" : ""
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_id">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                {t("sorting.byOrder")}
              </div>
            </SelectItem>
            <SelectItem value="object_name">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                {t("sorting.byObject")}
              </div>
            </SelectItem>
            <SelectItem value="name">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {t("sorting.byName")}
              </div>
            </SelectItem>
            <SelectItem value="position">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {t("sorting.byPosition")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={toggleSortOrder}
          className="border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 shrink-0"
          disabled={birthdayFilterActive}
        >
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      </div>

      <Button
        variant={birthdayFilterActive ? "default" : "outline"}
        onClick={toggleBirthdayFilter}
        className={`w-full ${
          birthdayFilterActive
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 dark:bg-slate-900"
        }`}
      >
        <Cake className="w-4 h-4 mr-2" />
        {t("filters.birthdays")}
      </Button>
    </div>
  );

  return (
    <div>
      {/* Mobile Controls - Fixed */}
      <div className="sticky top-28 z-30 mb-6 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 bg-[#f4f7fb] dark:bg-slate-950 py-4 lg:hidden">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Mobile Filter and Add Button */}
        <div className="flex gap-2">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Filter className="w-4 h-4 mr-2" />
                {t("filters.title")}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>{t("filters.filtersAndSorting")}</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <FilterControls />
              </div>
            </SheetContent>
          </Sheet>

          <ViewToggle />

          {userRole === "admin" && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Controls - Fixed */}
      <div className="sticky top-20 z-30 mb-8 hidden gap-4 border-b border-slate-200 dark:border-slate-800 bg-[#f4f7fb] dark:bg-slate-950 py-4 lg:flex lg:flex-row">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={handleSortChange}
            disabled={birthdayFilterActive}
          >
            <SelectTrigger
              className={`w-48 border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
                birthdayFilterActive ? "opacity-50" : ""
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order_id">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  {t("sorting.byOrder")}
                </div>
              </SelectItem>
              <SelectItem value="object_name">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {t("sorting.byObject")}
                </div>
              </SelectItem>
              <SelectItem value="name">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  {t("sorting.byName")}
                </div>
              </SelectItem>
              <SelectItem value="position">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  {t("sorting.byPosition")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            className="border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            disabled={birthdayFilterActive}
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>

          {/* Birthday Toggle Button */}
          <Button
            variant={birthdayFilterActive ? "default" : "outline"}
            onClick={toggleBirthdayFilter}
            className={
              birthdayFilterActive
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 dark:bg-slate-900"
            }
          >
            <Cake className="w-4 h-4 mr-2" />
            {t("filters.birthdays")}
          </Button>
        </div>

        <ViewToggle />

        {/* Add Employee Button - только для админа */}
        {userRole === "admin" && (
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("actions.add")}
          </Button>
        )}
      </div>

      {view === "table" ? (
        !loading && visibleUsers.length === 0 ? null : (
          <EmployeeTable
            users={visibleUsers}
            loading={loading}
            userRole={userRole}
            currentUserId={currentUserId}
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
          />
        )
      ) : (
      /* Employee Grid — skeleton cards until the directory arrives */
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 lg:gap-5">
        {loading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <EmployeeCardSkeleton key={i} />
            ))
          : visibleUsers.map((user) => (
              <EmployeeCard
                key={user._id}
                user={user}
                userRole={userRole}
                currentUserId={currentUserId}
                onUpdate={handleUpdateUser}
                onDelete={handleDeleteUser}
              />
            ))}
      </div>
      )}

      {/* Empty State */}
      {!loading && visibleUsers.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("employees.notFound")}
          </h3>
          <p className="text-gray-500">{t("employees.tryChangingFilters")}</p>
        </div>
      )}

      {/* Add Employee Dialog - только для админа */}
      {userRole === "admin" && (
        <AddEmployeeDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={handleAddUser}
        />
      )}
    </div>
  );
}
