import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";
import { verifyTwoFactorCode } from "@/lib/two-factor";

// POST { code } turns 2FA off. A current code is required, so someone using
// an unattended signed-in session can't quietly remove it.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();

  await connectDB();
  const user = await User.findById(session.user.id).select(
    "+twoFactorEnabled +twoFactorSecret"
  );
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }
  if (!verifyTwoFactorCode(code, user.twoFactorSecret)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { twoFactorEnabled: false },
      $unset: { twoFactorSecret: 1, twoFactorPendingSecret: 1 },
    }
  );

  return NextResponse.json({ enabled: false });
}
