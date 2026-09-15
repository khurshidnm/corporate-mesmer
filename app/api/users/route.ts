import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Avatar from "@/models/Avatar";
import { authOptions } from "../auth/[...nextauth]/route";
import { storeAvatar } from "@/lib/avatar";
import { InvalidImageError } from "@/lib/image";

// GET all users. The directory is small (~150 people) and avatars are URLs,
// so the whole list fits in one small response; sorting and search happen on
// the client.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Hidden users (e.g. a super admin account) are excluded from the list
    // for regular workers, but stay visible to admins so they remain manageable.
    const visibilityFilter =
      session.user?.role === "admin" ? {} : { hidden: { $ne: true } };

    const users = await User.find(visibilityFilter)
      .sort({ order_id: 1, createdAt: -1 })
      .select("-password")
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  // Generated up front so the avatar can be stored under the user's id before
  // the document exists; cleaned up below if creation fails.
  const userId = new mongoose.Types.ObjectId();

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      position,
      birthday,
      role,
      avatar,
      workerType,
      viewPermissions,
      order_id,
      object_name,
    } = body;

    // Get the highest order_id if not provided
    let finalOrderId = order_id;
    if (finalOrderId === undefined || finalOrderId === null) {
      const lastUser = await User.findOne().sort({ order_id: -1 });
      finalOrderId = lastUser ? lastUser.order_id + 1 : 0;
    }

    const user = await User.create({
      _id: userId,
      name,
      email,
      password,
      phone,
      position,
      birthday: new Date(birthday),
      role,
      avatar:
        (await storeAvatar(userId.toString(), avatar)) ||
        "/placeholder.svg?height=100&width=100",
      workerType,
      viewPermissions: viewPermissions || "both",
      order_id: finalOrderId,
      object_name,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Don't leave an orphaned image behind if the user was never created
    await Avatar.deleteOne({ user: userId }).catch(() => {});

    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Mongoose validation error (e.g. missing required RU/EN fields)
    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {}).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: messages.join(", ") || "Validation error" },
        { status: 400 }
      );
    }

    // Duplicate key error (e.g. email already exists)
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
