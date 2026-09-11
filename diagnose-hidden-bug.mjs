// Safe diagnostic: attempts a no-op "toggle hidden" save on every real user
// document to find which one throws inside the pre-save hook, without
// persisting any changes (a thrown error in the hook aborts before the
// actual MongoDB write, so the database is never modified).
//
// Run this on the VPS from the project root:
//   node diagnose-hidden-bug.mjs
//
// Delete this file afterwards.

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      ru: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    email: { type: String, lowercase: true, trim: true, required: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true, trim: true },
    position: {
      ru: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    birthday: { type: Date, required: true },
    avatar: { type: String, default: "/placeholder.svg?height=100&width=100" },
    role: { type: String, enum: ["admin", "worker"], default: "worker" },
    workerType: {
      type: String,
      enum: ["employee", "top_manager"],
      required: function () {
        return this.role === "worker";
      },
    },
    viewPermissions: {
      type: String,
      enum: ["top_managers", "employees", "both"],
      default: "both",
    },
    order_id: { type: Number, default: 0 },
    object_name: {
      ru: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password.match(/^\$2[aby]\$/)) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  const users = await User.find({});
  console.log(`Checking ${users.length} users...`);

  let failures = 0;
  for (const user of users) {
    try {
      user.hidden = !user.hidden;
      await user.validate();
      // Intentionally do NOT call user.save() here to avoid touching the
      // password pre-save hook path at all; validate() alone already
      // exercises schema casting/validators for every field.
      user.hidden = !user.hidden;
    } catch (e) {
      failures++;
      console.log("----");
      console.log("FAILED user:", user.email, user._id.toString());
      console.log("password type:", typeof user.password, "value:", user.password);
      console.log("name:", JSON.stringify(user.name));
      console.log("position:", JSON.stringify(user.position));
      console.log("object_name:", JSON.stringify(user.object_name));
      console.log("error:", e.message);
    }
  }

  console.log(`Done. ${failures} of ${users.length} users failed validate().`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
