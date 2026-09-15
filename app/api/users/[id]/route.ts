import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import Avatar from "@/models/Avatar";
import { storeAvatar } from "@/lib/avatar";
import { InvalidImageError } from "@/lib/image";

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const user = await User.findById(resolvedParams.id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    // Check if user can edit this profile
    const canEdit =
      session.user?.role === "admin" || session.user?.id === resolvedParams.id;

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      email,
      phone,
      position,
      birthday,
      role,
      avatar,
      password,
      workerType,
      viewPermissions,
      order_id,
      object_name,
      hidden,
    } = body;

    const updateData: any = {
      name,
      email,
      phone,
      position,
      birthday: new Date(birthday),
      avatar: await storeAvatar(resolvedParams.id, avatar),
    };

    if (session.user?.role === "admin") {
      if (role) {
        updateData.role = role;
      }
      if (workerType) {
        updateData.workerType = workerType;
      }
      if (viewPermissions) {
        updateData.viewPermissions = viewPermissions;
      }
      if (order_id !== undefined) {
        updateData.order_id = order_id;
      }

      if (object_name) {
        updateData.object_name = object_name;
      }

      if (hidden !== undefined) {
        updateData.hidden = hidden;
      }
    }

    // Handle password update manually to avoid double hashing
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Use findById and save to avoid pre-save middleware issues
    const user = await User.findById(resolvedParams.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update fields manually
    Object.keys(updateData).forEach((key) => {
      user[key] = updateData[key];
    });

    // Skip password hashing in pre-save middleware if we already hashed it
    if (password && password.trim() !== "") {
      user.isModified = function (path: string) {
        if (path === "password") return false;
        return this.constructor.prototype.isModified.call(this, path);
      };
    }

    await user.save();

    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    return NextResponse.json(userResponse);
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error?.name === "ValidationError") {
      const messages = Object.values(error.errors || {}).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: messages.join(", ") || "Validation error" },
        { status: 400 }
      );
    }

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

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    // Prevent admin from deleting themselves
    if (session.user?.id === resolvedParams.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndDelete(resolvedParams.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await Avatar.deleteOne({ user: resolvedParams.id });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
