import { authenticator } from "otplib";

// Google Authenticator codes: 6 digits, 30-second steps. Accept one step on
// either side so a slightly slow phone clock still works.
authenticator.options = { window: 1 };

const ISSUER = "MESMER";

export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

// The otpauth:// URL that the QR code encodes
export function twoFactorKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export function verifyTwoFactorCode(code: unknown, secret: string): boolean {
  if (typeof code !== "string") return false;
  const token = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
