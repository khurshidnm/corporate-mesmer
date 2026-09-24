import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";
import { isSuperAdmin } from "@/lib/groups";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT update a group (SUPER ADMIN ONLY: admin@mesmer.uz)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(session.user?.email)) {
      return NextResponse.json(
        { error: "Forbidden: Only super admin (admin@mesmer.uz) can edit groups" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { label, order } = body;

    if (!label || typeof label !== "string" || !label.trim()) {
      return NextResponse.json(
        { error: "Group label is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const group = await Group.findOne({ id: id.toLowerCase() });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const oldLabel = group.label;
    const newLabel = label.trim();

    group.label = newLabel;
    if (typeof order === "number") {
      group.order = order;
    }
    await group.save();

    // If label changed, update object_name for users assigned to this group
    if (oldLabel !== newLabel) {
      await User.updateMany(
        { groups: group.id },
        {
          $set: {
            "object_name.ru": newLabel,
            "object_name.en": newLabel,
          },
        }
      );
    }

    return NextResponse.json({
      id: group.id,
      label: group.label,
      order: group.order,
    });
  } catch (error: any) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE a group (SUPER ADMIN ONLY: admin@mesmer.uz)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(session.user?.email)) {
      return NextResponse.json(
        { error: "Forbidden: Only super admin (admin@mesmer.uz) can delete groups" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const groupId = id.toLowerCase();

    await connectDB();

    const group = await Group.findOne({ id: groupId });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    await Group.deleteOne({ _id: group._id });

    // Unassign this group from all users
    await User.updateMany(
      { groups: groupId },
      {
        $pull: { groups: groupId },
        $set: {
          "object_name.ru": "",
          "object_name.en": "",
        },
      }
    );

    return NextResponse.json({ success: true, deletedId: groupId });
  } catch (error: any) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete group" },
      { status: 500 }
    );
  }
}
