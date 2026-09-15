import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Avatar from "@/models/Avatar";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET the avatar image for a user. URLs are versioned (?v=<hash>), so the
// response is marked immutable and the browser never re-downloads it until
// the user uploads a new picture (which changes the URL).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(null, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return new NextResponse(null, { status: 404 });
    }

    await connectDB();

    const avatar = await Avatar.findOne({ user: id }).select(
      "data contentType hash"
    );

    if (!avatar) {
      return new NextResponse(null, { status: 404 });
    }

    const etag = `"${avatar.hash}"`;
    const headers = {
      "Content-Type": avatar.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      ETag: etag,
    };

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return new NextResponse(new Uint8Array(avatar.data), { headers });
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return new NextResponse(null, { status: 500 });
  }
}
