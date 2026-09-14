"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { EmployeeGrid } from "@/components/employee-grid";
import { BirthdayNotificationBell } from "@/components/birthday-notification-bell";
import { BirthdayWelcomeModal } from "@/components/birthday-welcome-modal";
import { TeamBirthdayModal } from "@/components/team-birthday-modal";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import type { User, BirthdayUser } from "@/types";
import Image from "next/image";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showTeamBirthdayModal, setShowTeamBirthdayModal] = useState(false);
  const [todayBirthdayUsers, setTodayBirthdayUsers] = useState<BirthdayUser[]>(
    []
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/auth/signin");
    }
  }, [session, status]);

  useEffect(() => {
    if (session) {
      loadUsers();
    }
  }, [session]);

  // Save selected section to localStorage whenever it changes
  useEffect(() => {
    if (selectedSection && currentUser) {
      localStorage.setItem(
        `selectedSection_${currentUser.email}`,
        selectedSection
      );
    }
  }, [selectedSection, currentUser]);

  const loadUsers = async () => {
    try {
      // Fetch users
      const response = await fetch("/api/users");
      if (response.ok) {
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);

        // Find current user
        const current = fetchedUsers.find(
          (user: User) => user.email === session?.user?.email
        );
        if (current) {
          setCurrentUser(current);

          // Only auto-navigate on initial load, not on subsequent reloads
          if (isInitialLoad) {
            // Try to restore saved section from localStorage first
            const savedSection = localStorage.getItem(
              `selectedSection_${current.email}`
            );

            if (
              savedSection &&
              (savedSection === "top_managers" || savedSection === "employees")
            ) {
              // Check if user has permission to access the saved section
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
                // If no permission for saved section, use default logic
                setDefaultSection(current);
              }
            } else {
              // No saved section, use default logic
              setDefaultSection(current);
            }
            setIsInitialLoad(false); // Mark that initial load is complete
          }

          // Check for today's birthdays
          await checkTodayBirthdays();
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
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

  const checkTodayBirthdays = async () => {
    try {
      const response = await fetch("/api/users/upcoming-birthdays?days=0");
      if (response.ok) {
        const birthdayUsers: BirthdayUser[] = await response.json();
        if (birthdayUsers.length > 0) {
          setTodayBirthdayUsers(birthdayUsers);

          // Check if modal was shown today
          const today = new Date().toDateString();
          const lastShown = localStorage.getItem("teamBirthdayModalShown");

          if (lastShown !== today) {
            // Show the modal with a slight delay to ensure the page is fully loaded
            setTimeout(() => {
              setShowTeamBirthdayModal(true);
              localStorage.setItem("teamBirthdayModalShown", today);
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error("Error checking today's birthdays:", error);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers((prev) =>
      prev.map((user) => (user._id === updatedUser._id ? updatedUser : user))
    );
  };

  const reloadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
        // Note: We don't reset selectedSection here to preserve user's choice
      }
    } catch (error) {
      console.error("Error reloading users:", error);
    }
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    // The useEffect will automatically save this to localStorage
  };

  const getFilteredUsers = () => {
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
    if (selectedSection === "top_managers") {
      return t("sidebar.topManagers");
    } else if (selectedSection === "employees") {
      return t("sidebar.employees");
    }
    return t("dashboard.allEmployees");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return null;
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
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
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
            <BirthdayNotificationBell />
            <LanguageToggle />
          </div>
        </div>

        {/* Fixed Desktop Header */}
        <div className="fixed left-64 right-0 top-0 z-40 hidden border-b border-slate-200 bg-white/95 px-8 py-4 backdrop-blur lg:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {getSectionTitle()}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <BirthdayNotificationBell />
              <LanguageToggle />
            </div>
          </div>
        </div>

        {/* Fixed Mobile Section Title */}
        <div className="fixed left-0 right-0 top-16 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <h1 className="text-xl font-semibold text-slate-900">
            {getSectionTitle()}
          </h1>
        </div>

        {/* Content with proper top padding to account for fixed headers */}
        <div className="flex-1 p-4 pt-32 lg:p-8 lg:pt-20">
          <EmployeeGrid
            users={getFilteredUsers()}
            setUsers={setUsers}
            userRole={userRole}
            currentUserId={currentUser._id}
            currentUser={currentUser}
            onReload={reloadUsers}
          />
        </div>
      </div>

      {/* Birthday Welcome Modal */}
      <BirthdayWelcomeModal
        open={showBirthdayModal}
        onOpenChange={setShowBirthdayModal}
      />

      {/* Team Birthday Modal - shows to everyone when someone has a birthday */}
      <TeamBirthdayModal
        users={todayBirthdayUsers}
        open={showTeamBirthdayModal}
        onOpenChange={setShowTeamBirthdayModal}
      />
    </div>
  );
}
