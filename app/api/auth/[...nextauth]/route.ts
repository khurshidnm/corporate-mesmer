import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { seedDatabase } from "@/lib/seed"
import { verifyTwoFactorCode } from "@/lib/two-factor"
import {
  TWO_FACTOR_REQUIRED,
  TWO_FACTOR_INVALID,
  ACCOUNT_LOCKED,
} from "@/lib/auth-errors"
import { isLocked, recordFailedLogin, clearFailedLogins } from "@/lib/login-attempts"

// Проверим, что в NextAuth правильно передается роль пользователя в сессию
// Убедимся, что callbacks для jwt и session работают корректно

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Authentication code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          await connectDB()
          await seedDatabase() // Ensure default users exist

          const user = await User.findOne({ email: credentials.email }).select(
            "+twoFactorEnabled +twoFactorSecret +failedLoginAttempts +lockUntil"
          )

          if (!user) {
            return null
          }

          // Checked before the password, so a locked account can't be used
          // to keep testing passwords
          if (isLocked(user.lockUntil)) {
            throw new Error(ACCOUNT_LOCKED)
          }

          if (!(await user.comparePassword(credentials.password))) {
            await recordFailedLogin(user._id)
            return null
          }

          // Password is right; users with 2FA also need a valid code. The
          // page asks for it only after seeing TWO_FACTOR_REQUIRED, and
          // resends the password with it, so no half-signed-in state exists.
          if (user.twoFactorEnabled && user.twoFactorSecret) {
            if (!credentials.code) {
              throw new Error(TWO_FACTOR_REQUIRED)
            }
            if (!verifyTwoFactorCode(credentials.code, user.twoFactorSecret)) {
              await recordFailedLogin(user._id)
              throw new Error(TWO_FACTOR_INVALID)
            }
          }

          if (user.failedLoginAttempts > 0 || user.lockUntil) {
            await clearFailedLogins(user._id)
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          if (
            error instanceof Error &&
            (error.message === TWO_FACTOR_REQUIRED ||
              error.message === TWO_FACTOR_INVALID ||
              error.message === ACCOUNT_LOCKED)
          ) {
            throw error
          }
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
