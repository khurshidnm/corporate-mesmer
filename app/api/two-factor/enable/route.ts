import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";
import { verifyTwoFactorCode } from "@/lib/two-factor";

// POST { code } confirms the scanned QR code and turns 2FA on
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();

  await connectDB();
  const user = await User.findById(session.user.id).select("+twoFactorPendingSecret");
  if (!user?.twoFactorPendingSecret) {
    return NextResponse.json({ error: "Start 2FA setup first" }, { status: 400 });
  }
  if (!verifyTwoFactorCode(code, user.twoFactorPendingSecret)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { twoFactorEnabled: true, twoFactorSecret: user.twoFactorPendingSecret },
      $unset: { twoFactorPendingSecret: 1 },
    }
  );

  return NextResponse.json({ enabled: true });
}
