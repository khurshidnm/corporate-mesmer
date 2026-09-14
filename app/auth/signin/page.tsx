"use client";

import type React from "react";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { LanguageToggle } from "@/components/language-toggle";
import Image from "next/image";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        const session = await getSession();
        router.push("/dashboard");
      } else {
        alert(t("auth.invalidCredentials"));
      }
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef4ff] px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-blue-700" />
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="relative w-full max-w-md border-slate-200 bg-white shadow-xl shadow-blue-950/10">
        <CardHeader className="space-y-4 pb-4 text-center">
          <Image
            src={"/mesmerlogo1.svg"}
            alt=""
            width={200}
            height={200}
            className="mx-auto h-16 w-auto"
          />
          <CardDescription className="text-slate-500">{t("auth.signInToAccount")}</CardDescription>
        </CardHeader>
        <CardContent className="pb-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={loading}>
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
