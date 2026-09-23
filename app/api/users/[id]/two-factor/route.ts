import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../../../auth/[...nextauth]/route";

type Params = { params: Promise<{ id: string }> };

// GET whether this employee has 2FA on (admin only)
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const user = await User.findById(id).select("+twoFactorEnabled");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ enabled: Boolean(user.twoFactorEnabled) });
}

// DELETE turns 2FA off for an employee who lost their phone (admin only).
// Also clears any login lockout from their failed attempts.
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const result = await User.updateOne(
    { _id: id },
    {
      $set: { twoFactorEnabled: false, failedLoginAttempts: 0 },
      $unset: { twoFactorSecret: 1, twoFactorPendingSecret: 1, lockUntil: 1 },
    }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ enabled: false });
}
