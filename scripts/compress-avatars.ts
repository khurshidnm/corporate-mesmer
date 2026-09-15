import connectDB from "../lib/mongodb";
import User from "../models/User";
import { compressAvatar } from "../lib/image";

// One-off migration: re-encode existing base64 avatars to small JPEGs.
// Run with: pnpm compress-avatars
async function main() {
  await connectDB();

  const users = await User.find({ avatar: { $regex: "^data:image" } });
  console.log(`Found ${users.length} user(s) with base64 avatars to compress`);

  let compressedBytes = 0;
  let originalBytes = 0;

  for (const user of users) {
    const original = user.avatar;

    try {
      const compressed = await compressAvatar(original);

      if (compressed && compressed !== original) {
        originalBytes += original.length;
        compressedBytes += compressed.length;
        user.avatar = compressed;
        await user.save({ validateModifiedOnly: true });
        console.log(
          `${user.email}: ${(original.length / 1024).toFixed(0)}KB -> ${(compressed.length / 1024).toFixed(0)}KB`
        );
      }
    } catch (error) {
      console.error(`Skipping ${user.email}: ${(error as Error).message}`);
    }
  }

  if (originalBytes > 0) {
    const savedPct = (1 - compressedBytes / originalBytes) * 100;
    console.log(
      `Done. Total ${(originalBytes / 1024 / 1024).toFixed(2)}MB -> ${(compressedBytes / 1024 / 1024).toFixed(2)}MB (${savedPct.toFixed(0)}% smaller)`
    );
  } else {
    console.log("Nothing to compress.");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
