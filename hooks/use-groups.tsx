"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  DEFAULT_GROUPS,
  type UserGroupItem,
  isSuperAdmin as checkSuperAdmin,
} from "@/lib/groups";

interface GroupsContextType {
  groups: UserGroupItem[];
  loading: boolean;
  isSuperAdmin: boolean;
  refreshGroups: () => Promise<void>;
  addGroup: (data: { label: string; id?: string }) => Promise<{ success: boolean; error?: string }>;
  updateGroup: (id: string, data: { label: string }) => Promise<{ success: boolean; error?: string }>;
  deleteGroup: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

export function GroupsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<UserGroupItem[]>(DEFAULT_GROUPS);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = checkSuperAdmin(session?.user?.email);

  const refreshGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGroups(data);
        }
      }
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      refreshGroups();
    }
  }, [session, refreshGroups]);

  const addGroup = async (data: { label: string; id?: string }) => {
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Failed to add group" };
      }
      await refreshGroups();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to add group" };
    }
  };

  const updateGroup = async (id: string, data: { label: string }) => {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Failed to update group" };
      }
      await refreshGroups();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update group" };
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Failed to delete group" };
      }
      await refreshGroups();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete group" };
    }
  };

  return (
    <GroupsContext.Provider
      value={{
        groups,
        loading,
        isSuperAdmin,
        refreshGroups,
        addGroup,
        updateGroup,
        deleteGroup,
      }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export function useGroups() {
  const context = useContext(GroupsContext);
  if (!context) {
    // Return fallback if called outside provider
    return {
      groups: DEFAULT_GROUPS,
      loading: false,
      isSuperAdmin: false,
      refreshGroups: async () => {},
      addGroup: async () => ({ success: false, error: "No provider" }),
      updateGroup: async () => ({ success: false, error: "No provider" }),
      deleteGroup: async () => ({ success: false, error: "No provider" }),
    };
  }
  return context;
}
