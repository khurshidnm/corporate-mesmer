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

      // 1. Find or pick the CEO / Root node (MESMER Group):
      // Prefer user with CEO/General Director position or email normurodov.khur.uzb@gmail.com or admin
      let ceo = allUsers.find(
        (u) =>
          u.email === "normurodov.khur.uzb@gmail.com" ||
          /ceo|general director|генеральный директор|председатель/i.test(
            `${u.position?.ru || ""} ${u.position?.en || ""}`
          )
      );
      if (!ceo) {
        ceo = allUsers.find((u) => u.role === "admin" && u.workerType === "top_manager") ||
              allUsers.find((u) => u.workerType === "top_manager") ||
              allUsers[0];
      }

      // CEO reports to nobody (root)
      await User.findByIdAndUpdate(ceo._id, { reportsTo: null });

      const remainingUsers = allUsers.filter(
        (u) => String(u._id) !== String(ceo._id)
      );

      // 4 Divisions at the same level:
      const divisionIds = ["mesmer", "mesal", "maxsus", "prestige_proekt"];
      
      for (const divId of divisionIds) {
        const divUsers = remainingUsers.filter((u) => u.groups?.includes(divId));
        if (divUsers.length === 0) continue;

        const managers = divUsers.filter((u) => u.workerType === "top_manager");
        const employees = divUsers.filter((u) => u.workerType !== "top_manager");

        // Find Division Director (first manager with Director in title, or first manager)
        let director = managers.find((m) =>
          /director|директор/i.test(`${m.position?.ru || ""} ${m.position?.en || ""}`)
        ) || managers[0];

        if (director) {
          // Division Director reports to CEO (MESMER Group)
          await User.findByIdAndUpdate(director._id, { reportsTo: ceo._id });

          // Department Managers report to the Division Director
          const deptManagers = managers.filter(
            (m) => String(m._id) !== String(director._id)
          );

          for (const dm of deptManagers) {
            await User.findByIdAndUpdate(dm._id, { reportsTo: director._id });
          }

          // Distribute team members across Department Managers (or to director if no dept managers)
          const targetManagers = deptManagers.length > 0 ? deptManagers : [director];
          for (let i = 0; i < employees.length; i++) {
            const assignedManager = targetManagers[i % targetManagers.length];
            await User.findByIdAndUpdate(employees[i]._id, {
              reportsTo: assignedManager._id,
            });
          }
        } else {
          // If no manager in division, employees report to CEO
          for (const emp of divUsers) {
            await User.findByIdAndUpdate(emp._id, { reportsTo: ceo._id });
          }
        }
      }

      // Any remaining users not belonging to the 4 divisions report to CEO
      const unassignedToDiv = remainingUsers.filter(
        (u) => !u.groups?.some((g) => divisionIds.includes(g))
      );
      for (const u of unassignedToDiv) {
        await User.findByIdAndUpdate(u._id, { reportsTo: ceo._id });
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
