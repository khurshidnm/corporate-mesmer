"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { EmployeeGrid } from "@/components/employee-grid";
import { BirthdayNotificationBell } from "@/components/birthday-notification-bell";
import { TeamBirthdayModal } from "@/components/team-birthday-modal";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import type { User, BirthdayUser } from "@/types";
import Image from "next/image";
import { USER_GROUPS, groupFromSection } from "@/lib/groups";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedSection, setSelectedSection] = useState("");
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>(
    []
  );
  const [showTeamBirthdayModal, setShowTeamBirthdayModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  // next-auth hands out a new session object on every refetch (e.g. when the
  // tab regains focus), so key the initial load on the stable user id instead.
  const sessionUserId = (session?.user as any)?.id as string | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/auth/signin");
    }
  }, [session, status]);

  useEffect(() => {
    if (!sessionUserId) return;
    loadCurrentUser(sessionUserId);
    loadUsers();
    loadBirthdays();
  }, [sessionUserId]);

  // Save selected section to localStorage whenever it changes
  useEffect(() => {
    if (selectedSection && currentUser) {
      localStorage.setItem(
        `selectedSection_${currentUser.email}`,
        selectedSection
      );
    }
  }, [selectedSection, currentUser]);

  const loadCurrentUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) return;

      const current: User = await response.json();
      setCurrentUser(current);

      // Restore the last opened section if the user may still access it
      const savedSection = localStorage.getItem(
        `selectedSection_${current.email}`
      );

      if (savedSection && groupFromSection(savedSection)) {
        // Group sections are open to everyone
        setSelectedSection(savedSection);
      } else if (
        savedSection &&
        (savedSection === "top_managers" || savedSection === "employees")
      ) {
        const hasPermission =
          (savedSection === "top_managers" &&
            (current.role === "admin" ||
              current.viewPermissions === "top_managers" ||
              current.viewPermissions === "both")) ||
          (savedSection === "employees" &&
            (current.role === "admin" ||
              current.viewPermissions === "employees" ||
              current.viewPermissions === "both"));

        if (hasPermission) {
          setSelectedSection(savedSection);
        } else {
          setDefaultSection(current);
        }
      } else {
        setDefaultSection(current);
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  // The whole directory comes down in one small response (avatars are URLs);
  // sorting, search and section filtering are all done on the client.
  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        setUsers(await response.json());
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // One request serves both the notification bell (next 7 days) and the
  // "someone has a birthday today" modal.
  const loadBirthdays = async () => {
    try {
      const response = await fetch("/api/users/upcoming-birthdays?days=7");
      if (!response.ok) return;

      const birthdays: BirthdayUser[] = await response.json();
      setUpcomingBirthdays(birthdays);

      const hasBirthdayToday = birthdays.some((u) => u.daysUntilBirthday === 0);
      const today = new Date().toDateString();
      if (
        hasBirthdayToday &&
        localStorage.getItem("teamBirthdayModalShown") !== today
      ) {
        // Slight delay so the page is fully painted before the modal appears
        setTimeout(() => {
          setShowTeamBirthdayModal(true);
          localStorage.setItem("teamBirthdayModalShown", today);
        }, 1000);
      }
    } catch (error) {
      console.error("Error loading birthdays:", error);
    }
  };

  const setDefaultSection = (current: User) => {
    // Auto-navigate based on permissions
    if (current.role === "admin") {
      setSelectedSection("employees"); // Admins start on employees section
    } else if (current.viewPermissions === "top_managers") {
      setSelectedSection("top_managers");
    } else if (current.viewPermissions === "employees") {
      setSelectedSection("employees");
    } else {
      setSelectedSection("employees"); // default to employees for "both"
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers((prev) =>
      prev.map((user) => (user._id === updatedUser._id ? updatedUser : user))
    );
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    // The useEffect will automatically save this to localStorage
  };

  const getFilteredUsers = () => {
    const group = groupFromSection(selectedSection);
    if (group) {
      return users.filter((user) => user.groups?.includes(group));
    }
    if (selectedSection === "top_managers") {
      // Only show top managers, NOT admins
      return users.filter((user) => user.workerType === "top_manager");
    } else if (selectedSection === "employees") {
      // Show employees AND admins
      return users.filter(
        (user) => user.workerType === "employee" || user.role === "admin"
      );
    }
    return users;
  };

  const getSectionTitle = () => {
    const group = groupFromSection(selectedSection);
    if (group) {
      return USER_GROUPS.find((g) => g.id === group)!.label;
    }
    if (selectedSection === "top_managers") {
      return t("sidebar.topManagers");
    } else if (selectedSection === "employees") {
      return t("sidebar.employees");
    }
    return t("dashboard.allEmployees");
  };

  const todayBirthdayUsers = upcomingBirthdays.filter(
    (user) => user.daysUntilBirthday === 0
  );

  // Only the session check and the tiny current-user request gate the page;
  // the directory itself renders as skeleton cards until it arrives.
  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userRole = currentUser.role as "admin" | "worker";

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 z-10">
        <Sidebar
          selectedSection={selectedSection}
          onSectionChange={handleSectionChange}
          userRole={userRole}
          currentUser={currentUser}
          onUserUpdate={handleUserUpdate}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* Sidebar Container */}
        <div
          className={`absolute top-0 left-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md flex items-center justify-center">
                <Image
                  src="/mesmerlogo1.svg"
                  alt="Mesmer Logo"
                  width={100}
                  height={100}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-full">
            <Sidebar
              selectedSection={selectedSection}
              onSectionChange={(section) => {
                handleSectionChange(section);
                setSidebarOpen(false);
              }}
              userRole={userRole}
              currentUser={currentUser}
              onUserUpdate={handleUserUpdate}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen flex flex-col">
        {/* Fixed Mobile Header */}
        <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="rounded-md flex items-center justify-center">
                <Image
                  src="/mesmerlogo1.svg"
                  alt="Mesmer Logo"
                  width={100}
                  height={100}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BirthdayNotificationBell birthdays={upcomingBirthdays} />
            <LanguageToggle />
          </div>
        </div>

        {/* Fixed Desktop Header */}
        <div className="fixed left-64 right-0 top-0 z-40 hidden h-20 border-b border-slate-200 bg-white px-8 lg:block">
          <div className="flex h-full items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {getSectionTitle()}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <BirthdayNotificationBell birthdays={upcomingBirthdays} />
              <LanguageToggle />
            </div>
          </div>
        </div>

        {/* Fixed Mobile Section Title */}
        <div className="fixed left-0 right-0 top-16 z-30 flex h-12 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
          <h1 className="text-xl font-semibold text-slate-900">
            {getSectionTitle()}
          </h1>
        </div>

        {/* Content with proper top padding to account for fixed headers */}
        <div className="flex-1 p-4 pt-28 lg:p-8 lg:pt-20">
          <EmployeeGrid
            users={getFilteredUsers()}
            loading={usersLoading}
            userRole={userRole}
            currentUserId={currentUser._id}
            currentUser={currentUser}
            onReload={loadUsers}
          />
        </div>
      </div>

      {/* Team Birthday Modal - shows to everyone when someone has a birthday */}
      <TeamBirthdayModal
        users={todayBirthdayUsers}
        open={showTeamBirthdayModal}
        onOpenChange={setShowTeamBirthdayModal}
      />
    </div>
  );
}
