"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "./image-upload";
import { useTranslation } from "@/hooks/use-translation";
import type { User, UpdateUserData, MultiLanguageText } from "@/types";
import { Settings, Save, X } from "lucide-react";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUpdate: (user: User) => void;
}

export function ProfileSettings({
  open,
  onOpenChange,
  user,
  onUpdate,
}: ProfileSettingsProps) {
  // Функция для безопасной инициализации многоязычных полей
  const initializeMultiLangField = (
    value: string | MultiLanguageText | undefined
  ): MultiLanguageText => {
    if (!value) return { ru: "", en: "" };
    if (typeof value === "string") {
      return { ru: value, en: value };
    }
    return value;
  };

  const [formData, setFormData] = useState<UpdateUserData>({
    name: initializeMultiLangField(user.name),
    email: user.email,
    password: "",
    phone: user.phone,
    position: initializeMultiLangField(user.position),
    birthday: user.birthday,
    avatar: user.avatar,
    role: user.role,
    workerType: user.workerType,
    viewPermissions: user.viewPermissions,
    order_id: user.order_id,
    object_name: initializeMultiLangField(user.object_name),
  });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // Функция для обновления многоязычных полей
  const updateMultiLangField = (
    field: "name" | "position" | "object_name",
    lang: "ru" | "en",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data for update - only send password if it's not empty
      const updateData = { ...formData };
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }

      const response = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUpdate(updatedUser);
        onOpenChange(false);
        // Reset password field
        setFormData((prev) => ({ ...prev, password: "" }));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            {t("profile.settings")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>{t("form.photo")}</Label>
            <ImageUpload
              value={formData.avatar}
              onChange={(value) => setFormData({ ...formData, avatar: value })}
            />
          </div>

          {/* Имя на двух языках */}
          <div className="space-y-3">
            <Label>{t("form.name")} *</Label>
            <Tabs defaultValue="ru" className="w-full">
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="ru" className="text-sm">
                  Русский
                </TabsTrigger>
                <TabsTrigger value="en" className="text-sm">
                  English
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ru" className="mt-0">
                <Input
                  id="name-ru"
                  value={formData.name.ru}
                  onChange={(e) =>
                    updateMultiLangField("name", "ru", e.target.value)
                  }
                  placeholder="Имя на русском языке"
                  required
                />
              </TabsContent>

              <TabsContent value="en" className="mt-0">
                <Input
                  id="name-en"
                  value={formData.name.en}
                  onChange={(e) =>
                    updateMultiLangField("name", "en", e.target.value)
                  }
                  placeholder="Name in English"
                  required
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Должность на двух языках */}
          <div className="space-y-3">
            <Label>{t("form.position")} *</Label>
            <Tabs defaultValue="ru" className="w-full">
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="ru" className="text-sm">
                  Русский
                </TabsTrigger>
                <TabsTrigger value="en" className="text-sm">
                  English
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ru" className="mt-0">
                <Input
                  id="position-ru"
                  value={formData.position.ru}
                  onChange={(e) =>
                    updateMultiLangField("position", "ru", e.target.value)
                  }
                  placeholder="Должность на русском языке"
                  required
                />
              </TabsContent>

              <TabsContent value="en" className="mt-0">
                <Input
                  id="position-en"
                  value={formData.position.en}
                  onChange={(e) =>
                    updateMultiLangField("position", "en", e.target.value)
                  }
                  placeholder="Position in English"
                  required
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Объект на двух языках */}
          <div className="space-y-3">
            <Label>{t("form.objectName")} *</Label>
            <Tabs defaultValue="ru" className="w-full">
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="ru" className="text-sm">
                  Русский
                </TabsTrigger>
                <TabsTrigger value="en" className="text-sm">
                  English
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ru" className="mt-0">
                <Input
                  id="object-name-ru"
                  value={formData.object_name.ru}
                  onChange={(e) =>
                    updateMultiLangField("object_name", "ru", e.target.value)
                  }
                  placeholder="Название объекта на русском языке"
                  required
                />
              </TabsContent>

              <TabsContent value="en" className="mt-0">
                <Input
                  id="object-name-en"
                  value={formData.object_name.en}
                  onChange={(e) =>
                    updateMultiLangField("object_name", "en", e.target.value)
                  }
                  placeholder="Object name in English"
                  required
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("form.email")} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {t("form.newPassword")} ({t("form.optional")})
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password || ""}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              minLength={6}
              placeholder={t("form.passwordPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("form.phone")} *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">{t("form.birthday")} *</Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) =>
                setFormData({ ...formData, birthday: e.target.value })
              }
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? t("actions.saving") : t("actions.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
