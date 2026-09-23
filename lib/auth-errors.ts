// Error codes that authorize() throws; NextAuth hands them to the sign-in
// page as `result.error`. Kept apart from the server-side auth helpers so the
// page doesn't bundle them.
export const TWO_FACTOR_REQUIRED = "2FA_REQUIRED";
export const TWO_FACTOR_INVALID = "2FA_INVALID";
export const ACCOUNT_LOCKED = "ACCOUNT_LOCKED";
