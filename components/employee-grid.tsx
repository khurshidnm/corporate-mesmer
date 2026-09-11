"use client";

import { useState } from "react";
import { EmployeeCard } from "./employee-card";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
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
  setUsers: (users: User[]) => void;
  userRole: "admin" | "worker";
  currentUserId?: string;
  currentUser?: User;
  onReload: () => void;
}

export function EmployeeGrid({
  users,
  setUsers,
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
  const { t } = useTranslation();

  // Filter users based on current user's view permissions
  const getFilteredUsersByPermissions = (allUsers: User[]) => {
    // Admin can see everyone
    if (userRole === "admin") {
      return allUsers;
    }

    // If no current user, return empty array for safety
    if (!currentUser) {
      console.log("No current user found");
      return [];
    }

    const { viewPermissions } = currentUser;

    const filtered = allUsers.filter((user) => {
      // Always show admins to everyone
      if (user.role === "admin") {
        return true;
      }

      // Filter based on permissions
      if (viewPermissions === "both") {
        return true;
      } else if (viewPermissions === "top_managers") {
        return user.workerType === "top_manager";
      } else if (viewPermissions === "employees") {
        return user.workerType === "employee";
      }

      return false;
    });

    return filtered;
  };

  const permissionFilteredUsers = getFilteredUsersByPermissions(users);

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

  const filteredUsers = permissionFilteredUsers.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getSearchableText(user?.name).toLowerCase().includes(searchLower) ||
      getSearchableText(user?.position).toLowerCase().includes(searchLower) ||
      getSearchableText(user?.object_name)
        .toLowerCase()
        .includes(searchLower) ||
      user?.email?.toLowerCase().includes(searchLower)
    );
  });

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

  const handleSortChange = async (newSortBy: string) => {
    // Если включаем не birthday сортировку, отключаем birthday фильтр
    if (newSortBy !== "birthday") {
      setBirthdayFilterActive(false);
    }

    setSortBy(newSortBy);

    try {
      const response = await fetch(
        `/api/users?sortBy=${newSortBy}&order=${sortOrder}`
      );
      if (response.ok) {
        const sortedUsers = await response.json();
        setUsers(sortedUsers);
      }
    } catch (error) {
      console.error("Error sorting users:", error);
    }
  };

  const toggleSortOrder = async () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);

    try {
      const response = await fetch(
        `/api/users?sortBy=${sortBy}&order=${newOrder}`
      );
      if (response.ok) {
        const sortedUsers = await response.json();
        setUsers(sortedUsers);
      }
    } catch (error) {
      console.error("Error sorting users:", error);
    }
  };

  const toggleBirthdayFilter = async () => {
    if (!birthdayFilterActive) {
      // Сохраняем текущую сортировку перед включением фильтра по дням рождения
      setPreviousSort({ by: sortBy, order: sortOrder });

      // Включаем фильтр по дням рождения
      setBirthdayFilterActive(true);
      setSortBy("birthday");
      setSortOrder("asc");

      try {
        const response = await fetch(`/api/users?sortBy=birthday&order=asc`);
        if (response.ok) {
          const sortedUsers = await response.json();
          setUsers(sortedUsers);
        }
      } catch (error) {
        console.error("Error sorting users by birthday:", error);
      }
    } else {
      // Отключаем фильтр и возвращаемся к предыдущей сортировке
      setBirthdayFilterActive(false);
      setSortBy(previousSort.by);
      setSortOrder(previousSort.order);

      try {
        const response = await fetch(
          `/api/users?sortBy=${previousSort.by}&order=${previousSort.order}`
        );
        if (response.ok) {
          const sortedUsers = await response.json();
          setUsers(sortedUsers);
        }
      } catch (error) {
        console.error("Error restoring previous sort:", error);
      }
    }
  };

  const FilterControls = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          value={sortBy}
          onValueChange={handleSortChange}
          disabled={birthdayFilterActive}
        >
          <SelectTrigger
            className={`flex-1 border-gray-300 ${
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
          className="border-gray-300 shrink-0"
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
            : "border-gray-300 hover:bg-gray-50 text-gray-700"
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
      <div className="flex flex-col gap-4 mb-6 lg:hidden sticky top-32 z-30 bg-white py-4 border-b border-gray-200 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Mobile Filter and Add Button */}
        <div className="flex gap-2">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 border-gray-300">
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
      <div className="hidden lg:flex lg:flex-row gap-4 mb-8 sticky top-20 z-30 py-4 shadow-sm bg-white">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              className={`w-48 border-gray-300 ${
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
            className="border-gray-300"
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
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
            }
          >
            <Cake className="w-4 h-4 mr-2" />
            {t("filters.birthdays")}
          </Button>
        </div>

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

      {/* Employee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
        {filteredUsers.map((user) => (
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

      {/* Empty State */}
      {filteredUsers.length === 0 && (
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
