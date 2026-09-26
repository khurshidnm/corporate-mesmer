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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "./image-upload";
import { GroupSelect } from "./group-select";
import { useGroups } from "@/hooks/use-groups";
import { AdminTwoFactorReset } from "./two-factor-settings";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/hooks/use-language";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User, UpdateUserData } from "@/types";
import { Edit, Save, X } from "lucide-react";

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUpdate: (user: User) => void;
  userRole?: "admin" | "worker";
  users?: User[];
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  user,
  onUpdate,
  userRole,
  users = [],
}: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState<UpdateUserData>({
    name: user.name || { ru: "", en: "" },
    email: user.email,
    password: "",
    phone: user.phone,
    position: user.position || { ru: "", en: "" },
    birthday: user.birthday
      ? new Date(user.birthday).toISOString().split("T")[0]
      : "",
    avatar: user.avatar,
    role: user.role,
    workerType: user.workerType,
    viewPermissions: user.viewPermissions,
    order_id: user.order_id,
    object_name: user.object_name || { ru: "", en: "" },
    hidden: user.hidden || false,
    room: user.room || "",
    reportsTo: user.reportsTo || null,
    groups: user.groups || [],
  });
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { groups } = useGroups();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...user, ...formData });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] p-0">
        <DialogHeader className="p-4 lg:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit className="w-5 h-5 text-blue-500" />
            {t("employees.editEmployee")}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4 p-4 lg:p-6 pt-0">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("form.photo")}</Label>
              <ImageUpload
                value={formData.avatar}
                onChange={(value) =>
                  setFormData({ ...formData, avatar: value })
                }
              />
            </div>

            <Tabs defaultValue="ru" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ru">Русский</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>

              <TabsContent value="ru" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-ru" className="text-sm font-medium">
                    {t("form.name")} (Русский)
                  </Label>
                  <Input
                    id="name-ru"
                    value={formData.name.ru}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: { ...formData.name, ru: e.target.value },
                      })
                    }
                    required
                    placeholder="Иван Иванов"
                    className="border-gray-300 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position-ru" className="text-sm font-medium">
                    {t("form.position")} (Русский)
                  </Label>
                  <Input
                    id="position-ru"
                    value={formData.position.ru}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: { ...formData.position, ru: e.target.value },
                      })
                    }
                    required
                    placeholder="Менеджер"
                    className="border-gray-300 focus:border-blue-500 text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-en" className="text-sm font-medium">
                    {t("form.name")} (English)
                  </Label>
                  <Input
                    id="name-en"
                    value={formData.name.en}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: { ...formData.name, en: e.target.value },
                      })
                    }
                    required
                    placeholder="Ivan Ivanov"
                    className="border-gray-300 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position-en" className="text-sm font-medium">
                    {t("form.position")} (English)
                  </Label>
                  <Input
                    id="position-en"
                    value={formData.position.en}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: { ...formData.position, en: e.target.value },
                      })
                    }
                    required
                    placeholder="Manager"
                    className="border-gray-300 focus:border-blue-500 text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("form.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="border-gray-300 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
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
                  className="border-gray-300 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t("form.phone")}
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    className="border-gray-300 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room" className="text-sm font-medium">
                    {t("form.room")} <span className="text-xs text-gray-500">({t("form.optional")})</span>
                  </Label>
                  <Input
                    id="room"
                    value={formData.room || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, room: e.target.value })
                    }
                    placeholder={t("form.roomPlaceholder")}
                    className="border-gray-300 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-sm font-medium">
                  {t("form.birthday")}
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) =>
                    setFormData({ ...formData, birthday: e.target.value })
                  }
                  required
                  className="border-gray-300 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  {t("form.role")}
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "worker") =>
                    setFormData({
                      ...formData,
                      role: value,
                      workerType:
                        value === "worker"
                          ? formData.workerType || "employee"
                          : formData.workerType,
                    })
                  }
                >
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">{t("roles.worker")}</SelectItem>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "worker" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="workerType" className="text-sm font-medium">
                      {t("form.workerType")}
                    </Label>
                    <Select
                      value={formData.workerType || "employee"}
                      onValueChange={(value: "employee" | "top_manager") =>
                        setFormData({ ...formData, workerType: value })
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">
                          {t("workerTypes.employee")}
                        </SelectItem>
                        <SelectItem value="top_manager">
                          {t("workerTypes.top_manager")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="viewPermissions"
                      className="text-sm font-medium"
                    >
                      {t("form.viewPermissions")}
                    </Label>
                    <Select
                      value={formData.viewPermissions || "both"}
                      onValueChange={(
                        value: "both" | "top_managers" | "employees"
                      ) => setFormData({ ...formData, viewPermissions: value })}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">
                          {t("viewPermissions.both")}
                        </SelectItem>
                        <SelectItem value="top_managers">
                          {t("viewPermissions.topManagers")}
                        </SelectItem>
                        <SelectItem value="employees">
                          {t("viewPermissions.employees")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Reports To (Direct Manager) */}
              {userRole === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="reportsTo" className="text-sm font-medium">
                    {t("form.reportsTo")}
                  </Label>
                  <Select
                    value={formData.reportsTo || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        reportsTo: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 text-sm">
                      <SelectValue placeholder={t("form.selectReportsTo")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t("form.noReportsTo")}
                      </SelectItem>
                      {users
                        .filter((u) => u._id !== user._id)
                        .map((u) => {
                          const uName = u.name[language] || u.name.ru;
                          const uPos = u.position[language] || u.position.ru;
                          return (
                            <SelectItem key={u._id} value={u._id}>
                              {uName} {uPos ? `(${uPos})` : ""}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="order_id" className="text-sm font-medium">
                  {t("form.order_id")}
                </Label>
                <Input
                  id="order_id"
                  type="number"
                  value={formData.order_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order_id: Number.parseInt(e.target.value) || 0,
                    })
                  }
                  className="border-gray-300 focus:border-blue-500 text-sm"
                />
              </div>

              {userRole === "admin" && (
                <GroupSelect
                  label="Объект работы (Русский)"
                  value={formData.groups || []}
                  onChange={(groupIds) => {
                    const selected = groups.find((g) => g.id === groupIds[0]);
                    const label = selected?.label || "";
                    setFormData({
                      ...formData,
                      groups: groupIds,
                      object_name: { ru: label, en: label },
                    });
                  }}
                />
              )}

              {userRole === "admin" && (
                <div className="flex items-center gap-2">
                  <input
                    id="hiddenFromList"
                    name="hiddenFromList"
                    type="checkbox"
                    checked={formData.hidden || false}
                    onChange={(e) =>
                      setFormData({ ...formData, hidden: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="hiddenFromList" className="text-sm font-medium">
                    {t("form.hiddenFromList")}
                  </Label>
                </div>
              )}

              {userRole === "admin" && open && <AdminTwoFactorReset userId={user._id} />}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 flex-1 text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {t("actions.save")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
