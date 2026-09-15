import { webcrypto } from "crypto";
import connectDB from "../lib/mongodb";
import User from "../models/User";
import { storeAvatar } from "../lib/avatar";

// The mongodb driver uses the Web Crypto global, which Node 18 doesn't expose.
// Next.js polyfills it for the app; standalone scripts have to do it themselves.
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// One-off migration: move inline base64 avatars out of User documents into the
// Avatar collection (compressing them on the way) and replace User.avatar with
// the versioned image URL. Safe to re-run; already-migrated users are skipped.
// Run with: pnpm migrate-avatars
async function main() {
  await connectDB();

  const filter = { avatar: { $regex: "^data:image" } };
  const total = await User.countDocuments(filter);
  console.log(`Found ${total} user(s) with inline avatars to migrate`);

  let migrated = 0;
  let inlineBytes = 0;

  // Cursor rather than find(): uncompressed avatars can be several MB each
  for await (const user of User.find(filter).select("email avatar").cursor()) {
    try {
      const url = await storeAvatar(user._id.toString(), user.avatar);
      await User.updateOne({ _id: user._id }, { $set: { avatar: url } });

      inlineBytes += user.avatar.length;
      migrated++;
      console.log(
        `${user.email}: ${(user.avatar.length / 1024).toFixed(0)}KB -> ${url}`
      );
    } catch (error) {
      console.error(`Skipping ${user.email}: ${(error as Error).message}`);
    }
  }

  console.log(
    `Done. Migrated ${migrated}/${total}; removed ${(inlineBytes / 1024 / 1024).toFixed(1)}MB of inline image data from user documents.`
  );

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
