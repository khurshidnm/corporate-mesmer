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

    const { searchParams } = new URL(request.url);
    const days = Number.parseInt(searchParams.get("days") || "30");

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const todayStr =
      `${today.getMonth() + 1}`.padStart(2, "0") +
      "-" +
      `${today.getDate()}`.padStart(2, "0");
    const endStr =
      `${endDate.getMonth() + 1}`.padStart(2, "0") +
      "-" +
      `${endDate.getDate()}`.padStart(2, "0");

    // Edge case: year boundary
    const matchCondition =
      days === 0
        ? { birthdayMonthDay: todayStr }
        : todayStr <= endStr
        ? {
            $expr: {
              $and: [
                { $gte: ["$birthdayMonthDay", todayStr] },
                { $lte: ["$birthdayMonthDay", endStr] },
              ],
            },
          }
        : {
            $expr: {
              $or: [
                { $gte: ["$birthdayMonthDay", todayStr] },
                { $lte: ["$birthdayMonthDay", endStr] },
              ],
            },
          };

    const pipeline = [
      {
        $addFields: {
          birthdayMonthDay: {
            $cond: [
              { $eq: [{ $type: "$birthday" }, "date"] },
              { $dateToString: { format: "%m-%d", date: "$birthday" } },
              null,
            ],
          },
        },
      },
      {
        $match: matchCondition,
      },
      {
        $project: {
          name: 1,
          position: 1,
          avatar: 1,
          birthday: 1,
        },
      },
    ];

    const users = await User.aggregate(pipeline);

    const currentYear = today.getFullYear();

    // Set today to start of day for accurate comparison
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const upcomingBirthdays = users
      .map((user) => {
        const birthday = new Date(user.birthday);

        // Create birthday for this year
        const birthdayThisYear = new Date(
          currentYear,
          birthday.getMonth(),
          birthday.getDate()
        );

        // Create birthday for next year
        const birthdayNextYear = new Date(
          currentYear + 1,
          birthday.getMonth(),
          birthday.getDate()
        );

        let daysUntil: number;

        // Check if birthday is today
        if (birthdayThisYear.getTime() === todayStart.getTime()) {
          daysUntil = 0;
        }
        // Check if birthday already passed this year
        else if (birthdayThisYear < todayStart) {
          // Use next year's birthday
          daysUntil = Math.ceil(
            (birthdayNextYear.getTime() - todayStart.getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }
        // Birthday is still coming this year
        else {
          daysUntil = Math.ceil(
            (birthdayThisYear.getTime() - todayStart.getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }

        // Special handling: if calculated as 365/366 days, check if it should be 0
        if (daysUntil >= 365) {
          const todayMonthDay =
            `${today.getMonth() + 1}`.padStart(2, "0") +
            "-" +
            `${today.getDate()}`.padStart(2, "0");
          const birthdayMonthDay =
            `${birthday.getMonth() + 1}`.padStart(2, "0") +
            "-" +
            `${birthday.getDate()}`.padStart(2, "0");

          if (todayMonthDay === birthdayMonthDay) {
            daysUntil = 0;
          }
        }

        return {
          _id: user._id,
          name: user.name,
          position: user.position,
          avatar: user.avatar,
          birthday: user.birthday,
          daysUntilBirthday: isNaN(daysUntil)
            ? Number.POSITIVE_INFINITY
            : daysUntil,
        };
      })
      .sort((a, b) => {
        // First priority: Today's birthdays (0 days) come first
        if (a.daysUntilBirthday === 0 && b.daysUntilBirthday !== 0) return -1;
        if (b.daysUntilBirthday === 0 && a.daysUntilBirthday !== 0) return 1;

        // Second priority: Sort by days until birthday (ascending)
        return a.daysUntilBirthday - b.daysUntilBirthday;
      });

    return NextResponse.json(upcomingBirthdays);
  } catch (error) {
    console.error("Error fetching upcoming birthdays:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
