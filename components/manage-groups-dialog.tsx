"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGroups } from "@/hooks/use-groups";
import { useTranslation } from "@/hooks/use-translation";
import { Layers, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

interface ManageGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageGroupsDialog({
  open,
  onOpenChange,
}: ManageGroupsDialogProps) {
  const { groups, isSuperAdmin, addGroup, updateGroup, deleteGroup } =
    useGroups();
  const { t } = useTranslation();

  const [newLabel, setNewLabel] = useState("");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  if (!isSuperAdmin) {
    return null;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setSubmittingAdd(true);
    setAddError("");

    const res = await addGroup({ label: newLabel.trim() });
    setSubmittingAdd(false);

    if (res.success) {
      setNewLabel("");
    } else {
      setAddError(res.error || "Failed to add group");
    }
  };

  const startEdit = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditLabel(currentLabel);
    setEditError("");
  };

  const handleUpdate = async (id: string) => {
    if (!editLabel.trim()) return;

    setSubmittingEdit(true);
    setEditError("");

    const res = await updateGroup(id, { label: editLabel.trim() });
    setSubmittingEdit(false);

    if (res.success) {
      setEditingId(null);
    } else {
      setEditError(res.error || "Failed to update group");
    }
  };

  const handleDelete = async (id: string) => {
    setSubmittingDelete(true);
    await deleteGroup(id);
    setSubmittingDelete(false);
    setDeletingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-blue-600" />
            {t("groups.manageTitle") || "Управление группами (Объектами)"}
          </DialogTitle>
          <DialogDescription>
            {t("groups.manageDescription") ||
              "Добавляйте, редактируйте или удаляйте группы. Доступно только главному администратору."}
          </DialogDescription>
        </DialogHeader>

        {/* Add Group Form */}
        <form onSubmit={handleAdd} className="space-y-3 pt-2">
          <Label htmlFor="new-group-name" className="text-sm font-medium">
            {t("groups.addTitle") || "Добавить новую группу"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="new-group-name"
              placeholder={t("groups.namePlaceholder") || "Название группы (напр. Prestige Proekt)"}
              value={newLabel}
              onChange={(e) => {
                setNewLabel(e.target.value);
                setAddError("");
              }}
              className="text-sm border-gray-300 focus:border-blue-500"
            />
            <Button
              type="submit"
              disabled={submittingAdd || !newLabel.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              {submittingAdd ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t("actions.add") || "Добавить"}
                </>
              )}
            </Button>
          </div>
          {addError && <p className="text-xs text-red-600">{addError}</p>}
        </form>

        {/* Groups List */}
        <div className="mt-4 space-y-2">
          <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            {t("groups.currentGroups") || "Текущие группы"} ({groups.length})
          </Label>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {groups.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">
                {t("groups.noGroups") || "Группы не созданы"}
              </div>
            ) : (
              groups.map((group) => {
                const isEditing = editingId === group.id;
                const isConfirmingDelete = deletingId === group.id;

                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 gap-2"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleUpdate(group.id);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={submittingEdit || !editLabel.trim()}
                          onClick={() => handleUpdate(group.id)}
                          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          {submittingEdit ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex-1 flex items-center justify-between gap-2 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 p-2 rounded-md">
                        <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                          {t("groups.confirmDelete") || "Удалить группу? (Сотрудники будут отвязаны)"}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={submittingDelete}
                            onClick={() => handleDelete(group.id)}
                            className="h-7 px-2 text-xs"
                          >
                            {submittingDelete ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              t("actions.delete") || "Да, удалить"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(null)}
                            className="h-7 px-2 text-xs"
                          >
                            {t("actions.cancel") || "Отмена"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                            {group.label}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {group.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(group.id, group.label)}
                            className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                            title={t("actions.edit") || "Редактировать"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingId(group.id)}
                            className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800"
                            title={t("actions.delete") || "Удалить"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {editError && <p className="text-xs text-red-600">{editError}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
