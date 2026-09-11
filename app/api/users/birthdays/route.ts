import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get today's date
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Find users with birthdays today
    const users = await User.aggregate([
      {
        $addFields: {
          birthdayMonth: { $month: "$birthday" },
          birthdayDay: { $dayOfMonth: "$birthday" },
        },
      },
      {
        $match: {
          birthdayMonth: todayMonth,
          birthdayDay: todayDay,
        },
      },
      {
        $project: {
          password: 0, // Exclude password from results
        },
      },
    ]);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching birthday users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
