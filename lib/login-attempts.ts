import User from "@/models/User";

// After this many wrong passwords or 2FA codes in a row, the account is
// locked for LOCK_MINUTES, even for the right password.
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export function isLocked(lockUntil?: Date | null): boolean {
  return Boolean(lockUntil && lockUntil.getTime() > Date.now());
}

export async function recordFailedLogin(userId: unknown): Promise<void> {
  // $inc is atomic, so parallel guesses can't slip past the limit
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { failedLoginAttempts: 1 } },
    { new: true }
  ).select("+failedLoginAttempts");

  if (user && user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          failedLoginAttempts: 0,
          lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
        },
      }
    );
  }
}

export async function clearFailedLogins(userId: unknown): Promise<void> {
  await User.updateOne(
    { _id: userId },
    { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
  );
}
