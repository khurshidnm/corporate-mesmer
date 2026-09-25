"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import { ShieldCheck } from "lucide-react";

type Step = "idle" | "setup" | "disable";

// Profile section where the signed-in user turns Google Authenticator 2FA on or off
export function TwoFactorSettings() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/two-factor")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setEnabled(data.enabled));
  }, []);

  const reset = () => {
    setStep("idle");
    setQrCode("");
    setSecret("");
    setCode("");
    setError("");
  };

  const startSetup = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/two-factor/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("setup");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(
        step === "setup" ? "/api/two-factor/enable" : "/api/two-factor/disable",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(t("twoFactor.invalidCode"));
        setCode("");
        return;
      }
      setEnabled(data.enabled);
      reset();
    } finally {
      setBusy(false);
    }
  };

  if (enabled === null) return null;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck
          className={`mt-0.5 h-5 w-5 shrink-0 ${enabled ? "text-green-600" : "text-slate-400"}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {t("twoFactor.title")}{" "}
            <span className={enabled ? "text-green-600" : "text-slate-400"}>
              · {enabled ? t("twoFactor.enabledStatus") : t("twoFactor.disabledStatus")}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {enabled ? t("twoFactor.enabledDescription") : t("twoFactor.disabledDescription")}
          </p>
        </div>
        {step === "idle" && (
          <Button
            type="button"
            size="sm"
            variant={enabled ? "outline" : "default"}
            onClick={enabled ? () => setStep("disable") : startSetup}
            disabled={busy}
          >
            {enabled ? t("twoFactor.disable") : t("twoFactor.enable")}
          </Button>
        )}
      </div>

      {step !== "idle" && (
        <form onSubmit={submitCode} className="space-y-3">
          {step === "setup" ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t("twoFactor.scanQr")}</p>
              <img src={qrCode} alt="" className="mx-auto h-[220px] w-[220px]" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("twoFactor.manualKey")}</p>
              <code className="block break-all rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-1 text-center text-xs tracking-wider">
                {secret}
              </code>
            </>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">{t("twoFactor.disablePrompt")}</p>
          )}
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            autoFocus
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset} disabled={busy}>
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={step === "disable" ? "destructive" : "default"}
              disabled={busy || code.length !== 6}
            >
              {step === "setup" ? t("twoFactor.confirm") : t("twoFactor.disable")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Admin-only: lets an admin turn 2FA off for an employee who lost their phone.
// Renders nothing unless that employee has 2FA on.
export function AdminTwoFactorReset({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}/two-factor`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setEnabled(data.enabled));
  }, [userId]);

  const reset = async () => {
    if (!confirm(t("twoFactor.resetConfirm"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${userId}/two-factor`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      setEnabled(false);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return <p className="text-sm text-green-600">{t("twoFactor.resetDone")}</p>;
  }
  if (!enabled) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 text-xs text-slate-600 dark:text-slate-300">{t("twoFactor.resetDescription")}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={reset}
        disabled={busy}
        className="shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {t("twoFactor.reset")}
      </Button>
    </div>
  );
}
