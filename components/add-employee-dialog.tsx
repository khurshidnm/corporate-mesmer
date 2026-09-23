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
import { GroupCheckboxes } from "./group-checkboxes";
import { useTranslation } from "@/hooks/use-translation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreateUserData } from "@/types";
import { UserPlus, X } from "lucide-react";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: CreateUserData) => void;
}

export function AddEmployeeDialog({
  open,
  onOpenChange,
  onAdd,
}: AddEmployeeDialogProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    name: { ru: "", en: "" },
    email: "",
    password: "",
    phone: "",
    position: { ru: "", en: "" },
    birthday: "",
    avatar: "/placeholder.svg?height=100&width=100",
    role: "worker",
    workerType: "employee",
    viewPermissions: "both",
    order_id: 0,
    object_name: { ru: "", en: "" },
    groups: [],
  });
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Radix tabs unmount inactive content, so HTML5 "required" never fires
    // for the hidden RU/EN tab; validate both languages manually here.
    if (
      !formData.name.ru ||
      !formData.name.en ||
      !formData.position.ru ||
      !formData.position.en ||
      !formData.object_name.ru ||
      !formData.object_name.en
    ) {
      alert(t("errors.fillAllLanguageFields"));
      return;
    }

    onAdd(formData);
    setFormData({
      name: { ru: "", en: "" },
      email: "",
      password: "",
      phone: "",
      position: { ru: "", en: "" },
      birthday: "",
      avatar: "/placeholder.svg?height=100&width=100",
      role: "worker",
      workerType: "employee",
      viewPermissions: "both",
      order_id: 0,
      object_name: { ru: "", en: "" },
      groups: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] p-0">
        <DialogHeader className="p-4 lg:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-blue-500" />
            {t("employees.addEmployee")}
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

                <div className="space-y-2">
                  <Label
                    htmlFor="object_name-ru"
                    className="text-sm font-medium"
                  >
                    {t("form.objectName")} (Русский)
                  </Label>
                  <Input
                    id="object_name-ru"
                    value={formData.object_name.ru}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        object_name: {
                          ...formData.object_name,
                          ru: e.target.value,
                        },
                      })
                    }
                    required
                    placeholder="Главный офис"
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

                <div className="space-y-2">
                  <Label
                    htmlFor="object_name-en"
                    className="text-sm font-medium"
                  >
                    {t("form.objectName")} (English)
                  </Label>
                  <Input
                    id="object_name-en"
                    value={formData.object_name.en}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        object_name: {
                          ...formData.object_name,
                          en: e.target.value,
                        },
                      })
                    }
                    required
                    placeholder="Main Office"
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
                  {t("form.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  placeholder="Минимум 6 символов"
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
                    setFormData({ ...formData, role: value })
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
                      value={formData.viewPermissions}
                      onValueChange={(
                        value: "top_managers" | "employees" | "both"
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

              <GroupCheckboxes
                value={formData.groups || []}
                onChange={(groups) => setFormData({ ...formData, groups })}
              />
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
                <UserPlus className="w-4 h-4 mr-2" />
                {t("actions.add")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
