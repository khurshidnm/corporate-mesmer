import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../auth/[...nextauth]/route";

// GET all users
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "order_id";
    const order = searchParams.get("order") || "asc";

    let sortOptions: any = {};

    if (sortBy === "birthday") {
      const users = await User.find(visibilityFilter).select("-password").lean();
      const today = new Date();
      const currentYear = today.getFullYear();

      const usersWithDays = users
        .map((user) => {
          if (!user.birthday) return null;

          const birthday = new Date(user.birthday);
          if (isNaN(birthday.getTime())) return null;

          let nextBirthday = new Date(
            currentYear,
            birthday.getMonth(),
            birthday.getDate()
          );
          if (nextBirthday < today) {
            nextBirthday.setFullYear(currentYear + 1);
          }

          const daysUntil = Math.ceil(
            (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            ...user,
            daysUntilBirthday: daysUntil,
          };
        })
        .filter(Boolean); // remove nulls

      const sortedUsers = usersWithDays.sort((a, b) =>
        order === "desc"
          ? b.daysUntilBirthday - a.daysUntilBirthday
          : a.daysUntilBirthday - b.daysUntilBirthday
      );

      return NextResponse.json(sortedUsers);
    }

    // All other sorts
    if (sortBy === "order_id") {
      sortOptions = { order_id: order === "desc" ? -1 : 1, createdAt: -1 };
    } else if (sortBy === "object_name") {
      sortOptions = { "object_name.ru": order === "desc" ? -1 : 1 };
    } else if (sortBy === "name") {
      sortOptions = { "name.ru": order === "desc" ? -1 : 1 };
    } else if (sortBy === "position") {
      sortOptions = { "position.ru": order === "desc" ? -1 : 1 };
    } else {
      sortOptions = { [sortBy]: order === "desc" ? -1 : 1 };
    }

    const users = await User.find(visibilityFilter)
      .sort(sortOptions)
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
      name,
      email,
      password,
      phone,
      position,
      birthday: new Date(birthday),
      role,
      avatar: avatar || "/placeholder.svg?height=100&width=100",
      workerType,
      viewPermissions: viewPermissions || "both",
      order_id: finalOrderId,
      object_name,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);

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
