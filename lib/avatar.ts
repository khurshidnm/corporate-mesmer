import { createHash } from "crypto";
import Avatar from "@/models/Avatar";
import { compressImage } from "@/lib/image";

const AVATAR_URL_PREFIX = "/api/avatars/";

/**
 * Persists a client-supplied avatar for `userId` and returns the value to
 * store in User.avatar:
 *  - base64 data URLs are compressed, written to the Avatar collection, and
 *    replaced by a versioned URL (`/api/avatars/<id>?v=<hash>`) that browsers
 *    can cache indefinitely;
 *  - our own avatar URLs pass through unchanged (nothing was re-uploaded);
 *  - anything else (placeholder, external URL) passes through and drops the
 *    stored image so it doesn't linger as garbage.
 * Throws InvalidImageError for bad uploads.
 */
export async function storeAvatar(
  userId: string,
  avatar?: string
): Promise<string | undefined> {
  if (!avatar) {
    return avatar;
  }

  if (avatar.startsWith("data:image")) {
    const data = await compressImage(avatar);
    const hash = createHash("sha1").update(data).digest("hex").slice(0, 12);

    await Avatar.findOneAndUpdate(
      { user: userId },
      { data, contentType: "image/jpeg", hash },
      { upsert: true }
    );

    return `${AVATAR_URL_PREFIX}${userId}?v=${hash}`;
  }

  if (!avatar.startsWith(AVATAR_URL_PREFIX)) {
    await Avatar.deleteOne({ user: userId });
  }

  return avatar;
}
