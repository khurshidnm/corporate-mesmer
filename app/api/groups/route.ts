import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Group from "@/models/Group";
import { DEFAULT_GROUPS, isSuperAdmin } from "@/lib/groups";

// Helper to seed default groups if none exist
async function ensureDefaultGroups() {
  const count = await Group.countDocuments();
  if (count === 0) {
    try {
      await Group.insertMany(DEFAULT_GROUPS);
    } catch {
      // Ignore race conditions on concurrent initial requests
    }
  }
}

// GET all groups (authenticated users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await ensureDefaultGroups();

    const groups = await Group.find()
      .sort({ order: 1, createdAt: 1 })
      .select("id label order -_id")
      .lean();

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST create a new group (SUPER ADMIN ONLY: admin@mesmer.uz)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSuperAdmin(session.user?.email)) {
      return NextResponse.json(
        { error: "Forbidden: Only super admin (admin@mesmer.uz) can add groups" },
        { status: 403 }
      );
    }

    await connectDB();
    await ensureDefaultGroups();

    const body = await request.json();
    const { label, id: customId } = body;

    if (!label || typeof label !== "string" || !label.trim()) {
      return NextResponse.json(
        { error: "Group label is required" },
        { status: 400 }
      );
    }

    const trimmedLabel = label.trim();

    // Generate or format group ID
    let groupId = (customId && typeof customId === "string" ? customId : "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    if (!groupId) {
      // Generate transliterated/cleaned slug from label
      groupId = trimmedLabel
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    }

    if (!groupId) {
      groupId = `group_${Date.now()}`;
    }

    // Check if ID already exists
    const existing = await Group.findOne({ id: groupId });
    if (existing) {
      return NextResponse.json(
        { error: `Group with ID "${groupId}" already exists` },
        { status: 409 }
      );
    }

    // Determine max order
    const lastGroup = await Group.findOne().sort({ order: -1 }).lean();
    const nextOrder = (lastGroup?.order ?? 0) + 1;

    const newGroup = await Group.create({
      id: groupId,
      label: trimmedLabel,
      order: nextOrder,
    });

    return NextResponse.json(
      {
        id: newGroup.id,
        label: newGroup.label,
        order: newGroup.order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
