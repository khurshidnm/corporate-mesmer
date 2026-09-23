import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";
import { generateTwoFactorSecret, twoFactorKeyUri } from "@/lib/two-factor";

// POST starts 2FA setup: stores a pending secret and returns it as a QR code.
// 2FA only turns on once the user confirms a code via /api/two-factor/enable.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("+twoFactorEnabled");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  const secret = generateTwoFactorSecret();
  await User.updateOne({ _id: user._id }, { twoFactorPendingSecret: secret });

  const qrCode = await QRCode.toDataURL(twoFactorKeyUri(user.email, secret), {
    width: 220,
    margin: 1,
  });

  // The secret is also returned so it can be typed in by hand
  return NextResponse.json({ qrCode, secret });
}
