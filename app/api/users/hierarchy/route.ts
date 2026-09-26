import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { USER_GROUPS } from "@/lib/groups";

// POST /api/users/hierarchy: update single relation or auto-organize
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    // 1. Single relation update: { userId, reportsTo }
    if (body.userId) {
      const { userId, reportsTo } = body;
      // Prevent self-reporting
      if (reportsTo && String(reportsTo) === String(userId)) {
        return NextResponse.json(
          { error: "User cannot report to themselves" },
          { status: 400 }
        );
      }

      await User.findByIdAndUpdate(userId, {
        reportsTo: reportsTo || null,
      });

      return NextResponse.json({ success: true });
    }

    // 2. Auto-organize structure: builds a hierarchy matching the corporate tree
    if (body.action === "auto-organize") {
      const allUsers = await User.find({ hidden: { $ne: true } })
        .sort({ order_id: 1, createdAt: 1 });

      if (allUsers.length === 0) {
        return NextResponse.json({ error: "No users found" }, { status: 400 });
      }

      // Find or pick the CEO / Root node:
      // First preference: top_manager with admin role, or first top_manager, or first user
      let ceo = allUsers.find(
        (u) => u.role === "admin" && u.workerType === "top_manager"
      );
      if (!ceo) {
        ceo = allUsers.find((u) => u.workerType === "top_manager") || allUsers[0];
      }

      // CEO reports to nobody (root)
      await User.findByIdAndUpdate(ceo._id, { reportsTo: null });

      // Group remaining users by their division/group
      const divisionDirectors: Record<string, string> = {};
      const remainingUsers = allUsers.filter(
        (u) => String(u._id) !== String(ceo._id)
      );

      // Separate into managers vs team members
      const managers = remainingUsers.filter((u) => u.workerType === "top_manager");
      const teamMembers = remainingUsers.filter((u) => u.workerType !== "top_manager");

      // For each manager, link them either as a Division Director (reporting to CEO)
      // or to another manager
      for (let i = 0; i < managers.length; i++) {
        const mgr = managers[i];
        const group = mgr.groups?.[0];

        // If this group doesn't have a director yet, this manager becomes Director reporting to CEO
        if (group && !divisionDirectors[group]) {
          divisionDirectors[group] = String(mgr._id);
          await User.findByIdAndUpdate(mgr._id, { reportsTo: ceo._id });
        } else {
          // Otherwise, report to the division director if in same group, or to CEO
          const parentId = (group && divisionDirectors[group]) || ceo._id;
          await User.findByIdAndUpdate(mgr._id, { reportsTo: parentId });
        }
      }

      // Link team members:
      // If their group has a director or manager, report to them; otherwise to CEO
      for (const emp of teamMembers) {
        const group = emp.groups?.[0];
        let parentId = (group && divisionDirectors[group]) || null;

        // If no director in group, check if any manager in that group exists
        if (!parentId && group) {
          const groupMgr = managers.find((m) => m.groups?.includes(group));
          if (groupMgr) parentId = String(groupMgr._id);
        }

        // Fallback to CEO if no manager found in group
        if (!parentId) {
          parentId = String(ceo._id);
        }

        await User.findByIdAndUpdate(emp._id, { reportsTo: parentId });
      }

      return NextResponse.json({ success: true, ceoId: ceo._id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating hierarchy:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
