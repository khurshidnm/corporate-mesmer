"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-9 w-9 p-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={t("theme.toggle")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">{t("theme.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-lg"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span className="text-sm">{t("theme.light")}</span>
          {mounted && theme === "light" && (
            <Check className="ml-auto h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80"
        >
          <Moon className="h-4 w-4 text-blue-400" />
          <span className="text-sm">{t("theme.dark")}</span>
          {mounted && theme === "dark" && (
            <Check className="ml-auto h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80"
        >
          <Monitor className="h-4 w-4 text-slate-400" />
          <span className="text-sm">{t("theme.system")}</span>
          {mounted && theme === "system" && (
            <Check className="ml-auto h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
