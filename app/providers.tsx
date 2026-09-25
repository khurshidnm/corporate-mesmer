"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { LanguageProvider } from "@/hooks/use-language"
import { GroupsProvider } from "@/hooks/use-groups"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LanguageProvider>
          <GroupsProvider>{children}</GroupsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
